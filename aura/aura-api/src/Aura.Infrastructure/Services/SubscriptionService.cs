using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Aura.Application.DTOs.Auth;
using Aura.Application.DTOs.Subscription;
using Aura.Application.Services;
using Aura.Domain.Entities;
using Aura.Domain.Interfaces;
using Aura.Infrastructure.Data;

namespace Aura.Infrastructure.Services;

public class SubscriptionService : ISubscriptionService
{
    private readonly AuraDbContext _context;
    private readonly IProfessorRepository _professorRepo;
    private readonly ISubscriptionRepository _subscriptionRepo;
    private readonly IConfiguration _config;
    private readonly ILogger<SubscriptionService> _logger;
    private static readonly HttpClient _httpClient = new() { Timeout = TimeSpan.FromSeconds(25) };

    public const decimal MonthlyPlanPrice = 29.90m;
    public const decimal AnnualPlanPrice = 299.00m;

    public SubscriptionService(
        AuraDbContext context,
        IProfessorRepository professorRepo,
        ISubscriptionRepository subscriptionRepo,
        IConfiguration config,
        ILogger<SubscriptionService> logger)
    {
        _context = context;
        _professorRepo = professorRepo;
        _subscriptionRepo = subscriptionRepo;
        _config = config;
        _logger = logger;
    }

    private async Task<string?> GetAsaasApiKeyAsync()
    {
        var key = Environment.GetEnvironmentVariable("ASAAS_API_KEY")
                  ?? _config["Asaas:ApiKey"];
        if (!string.IsNullOrWhiteSpace(key))
            return key.Trim();

        try
        {
            var dbSetting = await _context.PlatformSettings
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Key == "ASAAS_API_KEY");
            if (!string.IsNullOrWhiteSpace(dbSetting?.Value))
                return dbSetting.Value.Trim();
        }
        catch
        {
            // ignore if table not ready
        }

        return null;
    }

    private string GetAsaasBaseUrl(string? apiKey)
    {
        var configured = Environment.GetEnvironmentVariable("ASAAS_BASE_URL")
                         ?? _config["Asaas:BaseUrl"];
        if (!string.IsNullOrWhiteSpace(configured))
            return configured.Trim().TrimEnd('/');

        if (!string.IsNullOrEmpty(apiKey) && apiKey.Contains("hmlg", StringComparison.OrdinalIgnoreCase))
            return "https://sandbox.asaas.com/api/v3";

        return "https://api.asaas.com/v3";
    }

    public async Task<SubscriptionSummaryDto> GetSummaryAsync(Guid professorId)
    {
        var professor = await _professorRepo.GetByIdAsync(professorId)
            ?? throw new KeyNotFoundException("Professor não encontrado.");

        if (!professor.TrialEndsAt.HasValue && !professor.SubscriptionExpiresAt.HasValue)
        {
            professor.TrialEndsAt = DateTime.UtcNow.AddDays(14);
            professor.PlanType = "trial";
            professor.SubscriptionStatus = "trial";
            await _professorRepo.UpdateAsync(professor);
        }

        var enriched = AuthService.EnrichProfessorDto(professor, new ProfessorResponseDto
        {
            Id = professor.Id,
            PlanType = professor.PlanType,
            SubscriptionStatus = professor.SubscriptionStatus,
            TrialEndsAt = professor.TrialEndsAt,
            SubscriptionExpiresAt = professor.SubscriptionExpiresAt,
            CpfCnpj = professor.CpfCnpj
        });

        var history = await _subscriptionRepo.GetByProfessorIdAsync(professorId);
        var activeApiKey = await GetAsaasApiKeyAsync();

        return new SubscriptionSummaryDto
        {
            PlanType = enriched.PlanType,
            SubscriptionStatus = enriched.SubscriptionStatus,
            TrialEndsAt = enriched.TrialEndsAt,
            SubscriptionExpiresAt = enriched.SubscriptionExpiresAt,
            DaysRemaining = enriched.DaysRemaining,
            IsWriteAllowed = enriched.IsWriteAllowed,
            CpfCnpj = professor.CpfCnpj,
            GatewayConfigured = !string.IsNullOrEmpty(activeApiKey),
            History = history.Select(h => new SubscriptionHistoryItemDto
            {
                Id = h.Id,
                PlanType = h.PlanType,
                Price = h.Price,
                Status = h.Status,
                BillingType = h.BillingType,
                StartDate = h.StartDate,
                EndDate = h.EndDate,
                InvoiceUrl = h.InvoiceUrl,
                PixQrCodeImage = h.PixQrCodeImage,
                PixCopyPaste = h.PixCopyPaste,
                CreatedAt = h.CreatedAt
            }).ToList()
        };
    }

    public async Task<SubscriptionCheckoutResponseDto> CreateCheckoutAsync(Guid professorId, CreateCheckoutDto dto)
    {
        var professor = await _professorRepo.GetByIdAsync(professorId)
            ?? throw new KeyNotFoundException("Professor não encontrado.");

        var digitsOnlyCpfCnpj = Regex.Replace(dto.CpfCnpj ?? string.Empty, @"\D", "");
        if (digitsOnlyCpfCnpj.Length != 11 && digitsOnlyCpfCnpj.Length != 14)
            throw new ArgumentException("Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.");

        professor.CpfCnpj = digitsOnlyCpfCnpj;
        if (!string.IsNullOrWhiteSpace(dto.Phone))
            professor.Phone = dto.Phone.Trim();
        await _professorRepo.UpdateAsync(professor);

        var planType = dto.PlanType.ToLowerInvariant() == "annual" ? "annual" : "monthly";
        var price = planType == "annual" ? AnnualPlanPrice : MonthlyPlanPrice;
        var billingType = string.IsNullOrWhiteSpace(dto.BillingType) ? "PIX" : dto.BillingType.ToUpperInvariant();

        var subscription = new Subscription
        {
            ProfessorId = professorId,
            PlanType = planType,
            Price = price,
            Status = "pending",
            BillingType = billingType,
            StartDate = DateTime.UtcNow
        };
        await _subscriptionRepo.AddAsync(subscription);

        var apiKey = await GetAsaasApiKeyAsync();
        if (string.IsNullOrEmpty(apiKey))
        {
            // Demo / Sandbox fallback when ASAAS_API_KEY is not yet configured in environment
            subscription.PaymentGatewayId = $"demo_{subscription.Id:N}";
            subscription.PixCopyPaste = $"00020126580014BR.GOV.BCB.PIX0136aura-saas-{subscription.Id.ToString()[..8]}5204000053039865405{price:0.00}5802BR5915AURA PLATAFORMA6009SAO PAULO62070503***6304ABCD";
            subscription.InvoiceUrl = null;
            await _subscriptionRepo.UpdateAsync(subscription);

            return new SubscriptionCheckoutResponseDto
            {
                SubscriptionId = subscription.Id,
                PlanType = planType,
                Price = price,
                Status = subscription.Status,
                BillingType = billingType,
                PaymentGatewayId = subscription.PaymentGatewayId,
                InvoiceUrl = subscription.InvoiceUrl,
                PixQrCodeImage = null,
                PixCopyPaste = subscription.PixCopyPaste,
                IsSandboxOrDemo = true,
                GatewayMessage = "Modo de Demonstração Ativo: configure a variável ASAAS_API_KEY no servidor para gerar cobranças reais no Asaas. Você pode testar a ativação clicando em 'Simular Pagamento Aprovado'."
            };
        }

        var baseUrl = GetAsaasBaseUrl(apiKey);
        var isSandbox = baseUrl.Contains("sandbox", StringComparison.OrdinalIgnoreCase);

        try
        {
            // 1. Ensure Customer in Asaas
            await EnsureAsaasCustomerAsync(professor, digitsOnlyCpfCnpj, baseUrl, apiKey, forceRecreate: false);

            // 2. Create Payment in Asaas
            var description = planType == "annual"
                ? "Assinatura Aura Pro — Plano Anual (12 meses de acesso completo)"
                : "Assinatura Aura Pro — Plano Mensal (30 dias de acesso completo)";

            var effectiveBillingType = billingType == "CREDIT_CARD" ? "UNDEFINED" : billingType;

            HttpResponseMessage payRes = await SendCreatePaymentRequestAsync(
                baseUrl, apiKey, professor.AsaasCustomerId!, effectiveBillingType, price, description, subscription.Id);
            var payBody = await payRes.Content.ReadAsStringAsync();

            // If customer ID in DB was from an old/sandbox account, recreate customer and retry once
            if (!payRes.IsSuccessStatusCode && payBody.Contains("customer", StringComparison.OrdinalIgnoreCase))
            {
                payRes.Dispose();
                await EnsureAsaasCustomerAsync(professor, digitsOnlyCpfCnpj, baseUrl, apiKey, forceRecreate: true);
                payRes = await SendCreatePaymentRequestAsync(
                    baseUrl, apiKey, professor.AsaasCustomerId!, effectiveBillingType, price, description, subscription.Id);
                payBody = await payRes.Content.ReadAsStringAsync();
            }

            if (!payRes.IsSuccessStatusCode)
            {
                payRes.Dispose();
                _logger.LogError("Erro ao criar cobrança no Asaas: {Status} - {Body}", payRes.StatusCode, payBody);
                throw new InvalidOperationException(ExtractAsaasErrorMessage(payBody, "Não foi possível gerar a cobrança no Asaas."));
            }
            payRes.Dispose();

            using var payDoc = JsonDocument.Parse(payBody);
            var paymentId = payDoc.RootElement.GetProperty("id").GetString();
            var invoiceUrl = payDoc.RootElement.TryGetProperty("invoiceUrl", out var invProp) ? invProp.GetString() : null;

            subscription.PaymentGatewayId = paymentId;
            subscription.InvoiceUrl = invoiceUrl;

            // 3. Fetch PIX QR Code so professor can pay directly inside Aura modal
            if (!string.IsNullOrEmpty(paymentId))
            {
                using var pixReq = CreateAsaasRequest(HttpMethod.Get, $"{baseUrl}/payments/{paymentId}/pixQrCode", apiKey);
                using var pixRes = await _httpClient.SendAsync(pixReq);
                if (!pixRes.IsSuccessStatusCode)
                {
                    // Ensure at least one EVP PIX key exists on the Asaas account and retry once
                    using var evpReq = CreateAsaasRequest(HttpMethod.Post, $"{baseUrl}/pix/addressKeys", apiKey, new { type = "EVP" });
                    using var _ = await _httpClient.SendAsync(evpReq);

                    using var pixRetryReq = CreateAsaasRequest(HttpMethod.Get, $"{baseUrl}/payments/{paymentId}/pixQrCode", apiKey);
                    using var pixRetryRes = await _httpClient.SendAsync(pixRetryReq);
                    if (pixRetryRes.IsSuccessStatusCode)
                    {
                        var pixRetryBody = await pixRetryRes.Content.ReadAsStringAsync();
                        PopulatePixFields(subscription, pixRetryBody);
                    }
                }
                else
                {
                    var pixBody = await pixRes.Content.ReadAsStringAsync();
                    PopulatePixFields(subscription, pixBody);
                }
            }

            await _subscriptionRepo.UpdateAsync(subscription);

            return new SubscriptionCheckoutResponseDto
            {
                SubscriptionId = subscription.Id,
                PlanType = planType,
                Price = price,
                Status = subscription.Status,
                BillingType = billingType,
                PaymentGatewayId = subscription.PaymentGatewayId,
                InvoiceUrl = subscription.InvoiceUrl,
                PixQrCodeImage = subscription.PixQrCodeImage,
                PixCopyPaste = subscription.PixCopyPaste,
                IsSandboxOrDemo = isSandbox,
                GatewayMessage = isSandbox ? "Ambiente Sandbox do Asaas ativo." : null
            };
        }
        catch (Exception ex) when (ex is not ArgumentException && ex is not InvalidOperationException)
        {
            _logger.LogError(ex, "Falha de comunicação com o gateway Asaas para o professor {ProfessorId}", professorId);
            throw new InvalidOperationException("Falha de comunicação com o provedor de pagamentos. Tente novamente em instantes.");
        }
    }

    public async Task<SubscriptionSummaryDto> VerifySubscriptionStatusAsync(Guid professorId, Guid subscriptionId, bool simulateConfirmIfDemo = false)
    {
        var professor = await _professorRepo.GetByIdAsync(professorId)
            ?? throw new KeyNotFoundException("Professor não encontrado.");

        var subscription = await _subscriptionRepo.GetByIdAsync(subscriptionId)
            ?? throw new KeyNotFoundException("Cobrança não encontrada.");

        if (subscription.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado a esta assinatura.");

        if (subscription.Status == "active")
            return await GetSummaryAsync(professorId);

        var apiKey = await GetAsaasApiKeyAsync();
        var isDemoCharge = subscription.PaymentGatewayId != null && subscription.PaymentGatewayId.StartsWith("demo_", StringComparison.OrdinalIgnoreCase);

        if (isDemoCharge && simulateConfirmIfDemo && string.IsNullOrEmpty(apiKey))
        {
            await ActivateSubscriptionInternalAsync(subscription, professor);
            return await GetSummaryAsync(professorId);
        }

        if (!string.IsNullOrEmpty(apiKey) && !string.IsNullOrEmpty(subscription.PaymentGatewayId) && !isDemoCharge)
        {
            var baseUrl = GetAsaasBaseUrl(apiKey);
            using var req = CreateAsaasRequest(HttpMethod.Get, $"{baseUrl}/payments/{subscription.PaymentGatewayId}", apiKey);
            using var res = await _httpClient.SendAsync(req);
            if (res.IsSuccessStatusCode)
            {
                var body = await res.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(body);
                var gatewayStatus = doc.RootElement.TryGetProperty("status", out var stProp) ? stProp.GetString() : null;
                if (IsAsaasPaidStatus(gatewayStatus))
                {
                    await ActivateSubscriptionInternalAsync(subscription, professor);
                }
            }
        }

        return await GetSummaryAsync(professorId);
    }

    public async Task HandleAsaasWebhookAsync(AsaasWebhookPayloadDto payload, string? webhookTokenHeader)
    {
        var configuredWebhookToken = Environment.GetEnvironmentVariable("ASAAS_WEBHOOK_TOKEN")
                                     ?? _config["Asaas:WebhookToken"];

        if (!string.IsNullOrWhiteSpace(configuredWebhookToken))
        {
            if (string.IsNullOrWhiteSpace(webhookTokenHeader) || !string.Equals(configuredWebhookToken.Trim(), webhookTokenHeader.Trim(), StringComparison.Ordinal))
            {
                _logger.LogWarning("Webhook Asaas rejeitado: token inválido.");
                throw new UnauthorizedAccessException("Webhook token inválido.");
            }
        }

        if (payload?.Payment == null || string.IsNullOrWhiteSpace(payload.Payment.Id))
            return;

        var subscription = await _subscriptionRepo.GetByGatewayIdAsync(payload.Payment.Id);
        if (subscription == null && Guid.TryParse(payload.Payment.ExternalReference, out var subId))
        {
            subscription = await _subscriptionRepo.GetByIdAsync(subId);
        }

        if (subscription == null)
        {
            _logger.LogInformation("Webhook Asaas ignorado: cobrança {PaymentId} não localizada no Aura.", payload.Payment.Id);
            return;
        }

        var professor = await _professorRepo.GetByIdAsync(subscription.ProfessorId);
        if (professor == null) return;

        var evt = (payload.Event ?? string.Empty).ToUpperInvariant();
        if (evt == "PAYMENT_RECEIVED" || evt == "PAYMENT_CONFIRMED" || IsAsaasPaidStatus(payload.Payment.Status))
        {
            if (subscription.Status != "active")
            {
                await ActivateSubscriptionInternalAsync(subscription, professor);
                _logger.LogInformation("Assinatura {SubscriptionId} ativada via Webhook Asaas para o professor {ProfessorId}", subscription.Id, professor.Id);
            }
        }
        else if (evt == "PAYMENT_OVERDUE")
        {
            if (subscription.Status == "pending")
            {
                subscription.Status = "overdue";
                await _subscriptionRepo.UpdateAsync(subscription);
            }
        }
        else if (evt == "PAYMENT_DELETED" || evt == "PAYMENT_REFUNDED")
        {
            subscription.Status = "canceled";
            await _subscriptionRepo.UpdateAsync(subscription);
        }
    }

    private async Task ActivateSubscriptionInternalAsync(Subscription subscription, Professor professor)
    {
        var now = DateTime.UtcNow;
        var baseDate = professor.SubscriptionExpiresAt.HasValue && professor.SubscriptionExpiresAt.Value > now
            ? professor.SubscriptionExpiresAt.Value
            : now;

        var daysToAdd = subscription.PlanType == "annual" ? 365 : 30;
        var newExpiry = baseDate.AddDays(daysToAdd);

        subscription.Status = "active";
        subscription.StartDate = now;
        subscription.EndDate = newExpiry;
        await _subscriptionRepo.UpdateAsync(subscription);

        professor.PlanType = subscription.PlanType;
        professor.SubscriptionStatus = "active";
        professor.SubscriptionExpiresAt = newExpiry;
        await _professorRepo.UpdateAsync(professor);
    }

    private async Task EnsureAsaasCustomerAsync(
        Professor professor,
        string digitsOnlyCpfCnpj,
        string baseUrl,
        string apiKey,
        bool forceRecreate)
    {
        if (!forceRecreate && !string.IsNullOrWhiteSpace(professor.AsaasCustomerId))
            return;

        var rawPhone = Regex.Replace(professor.Phone ?? string.Empty, @"\D", "");
        var validMobilePhone = (rawPhone.Length == 10 || rawPhone.Length == 11) ? rawPhone : null;

        var customerPayload = new Dictionary<string, object?>
        {
            ["name"] = string.IsNullOrWhiteSpace(professor.Name) ? professor.Email : professor.Name,
            ["email"] = professor.Email,
            ["cpfCnpj"] = digitsOnlyCpfCnpj,
            ["externalReference"] = professor.Id.ToString(),
            ["notificationDisabled"] = false
        };
        if (validMobilePhone != null)
        {
            customerPayload["mobilePhone"] = validMobilePhone;
        }

        using var custReq = CreateAsaasRequest(HttpMethod.Post, $"{baseUrl}/customers", apiKey, customerPayload);
        using var custRes = await _httpClient.SendAsync(custReq);
        var custBody = await custRes.Content.ReadAsStringAsync();

        if (!custRes.IsSuccessStatusCode)
        {
            _logger.LogError("Erro ao criar cliente no Asaas: {Status} - {Body}", custRes.StatusCode, custBody);
            throw new InvalidOperationException(ExtractAsaasErrorMessage(custBody, "Não foi possível registrar os dados de faturamento no Asaas. Verifique o CPF/CNPJ informado."));
        }

        using var custDoc = JsonDocument.Parse(custBody);
        professor.AsaasCustomerId = custDoc.RootElement.GetProperty("id").GetString();
        await _professorRepo.UpdateAsync(professor);
    }

    private static async Task<HttpResponseMessage> SendCreatePaymentRequestAsync(
        string baseUrl,
        string apiKey,
        string customerId,
        string billingType,
        decimal price,
        string description,
        Guid subscriptionId)
    {
        var paymentPayload = new
        {
            customer = customerId,
            billingType,
            value = price,
            dueDate = DateTime.UtcNow.AddDays(2).ToString("yyyy-MM-dd"),
            description,
            externalReference = subscriptionId.ToString()
        };

        using var payReq = CreateAsaasRequest(HttpMethod.Post, $"{baseUrl}/payments", apiKey, paymentPayload);
        return await _httpClient.SendAsync(payReq);
    }

    private static void PopulatePixFields(Subscription subscription, string pixJsonBody)
    {
        try
        {
            using var pixDoc = JsonDocument.Parse(pixJsonBody);
            if (pixDoc.RootElement.TryGetProperty("encodedImage", out var imgProp))
                subscription.PixQrCodeImage = imgProp.GetString();
            if (pixDoc.RootElement.TryGetProperty("payload", out var payloadProp))
                subscription.PixCopyPaste = payloadProp.GetString();
        }
        catch
        {
            // ignore JSON parse issues
        }
    }

    private static bool IsAsaasPaidStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return false;
        var s = status.ToUpperInvariant();
        return s == "RECEIVED" || s == "CONFIRMED" || s == "RECEIVED_IN_CASH";
    }

    private static HttpRequestMessage CreateAsaasRequest(HttpMethod method, string url, string apiKey, object? body = null)
    {
        var req = new HttpRequestMessage(method, url);
        req.Headers.Add("access_token", apiKey);
        req.Headers.UserAgent.ParseAdd("AuraTeacherPlatform/1.0");
        req.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        if (body != null)
        {
            var json = JsonSerializer.Serialize(body);
            req.Content = new StringContent(json, Encoding.UTF8, "application/json");
        }
        return req;
    }

    private static string ExtractAsaasErrorMessage(string responseJson, string fallback)
    {
        try
        {
            using var doc = JsonDocument.Parse(responseJson);
            if (doc.RootElement.TryGetProperty("errors", out var errors) &&
                errors.ValueKind == JsonValueKind.Array &&
                errors.GetArrayLength() > 0)
            {
                var first = errors[0];
                if (first.TryGetProperty("description", out var desc) && !string.IsNullOrWhiteSpace(desc.GetString()))
                    return desc.GetString()!;
            }
        }
        catch
        {
            // ignore JSON parse issues
        }
        return fallback;
    }
}
