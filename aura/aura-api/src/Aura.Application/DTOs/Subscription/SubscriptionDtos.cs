using System.ComponentModel.DataAnnotations;

namespace Aura.Application.DTOs.Subscription;

public class CreateCheckoutDto
{
    [Required(ErrorMessage = "O tipo de plano é obrigatório.")]
    [RegularExpression("^(monthly|annual)$", ErrorMessage = "O plano deve ser 'monthly' ou 'annual'.")]
    public string PlanType { get; set; } = "monthly";

    [RegularExpression("^(PIX|CREDIT_CARD|BOLETO|UNDEFINED)$", ErrorMessage = "Forma de pagamento inválida.")]
    public string BillingType { get; set; } = "PIX";

    [Required(ErrorMessage = "Informe seu CPF ou CNPJ para emissão da cobrança.")]
    [MaxLength(25)]
    public string CpfCnpj { get; set; } = string.Empty;

    [MaxLength(40)]
    public string? Phone { get; set; }
}

public class SubscriptionCheckoutResponseDto
{
    public Guid SubscriptionId { get; set; }
    public string PlanType { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Status { get; set; } = string.Empty;
    public string BillingType { get; set; } = string.Empty;
    public string? PaymentGatewayId { get; set; }
    public string? InvoiceUrl { get; set; }
    public string? PixQrCodeImage { get; set; }
    public string? PixCopyPaste { get; set; }
    public bool IsSandboxOrDemo { get; set; }
    public string? GatewayMessage { get; set; }
}

public class SubscriptionHistoryItemDto
{
    public Guid Id { get; set; }
    public string PlanType { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Status { get; set; } = string.Empty;
    public string BillingType { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? InvoiceUrl { get; set; }
    public string? PixQrCodeImage { get; set; }
    public string? PixCopyPaste { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SubscriptionSummaryDto
{
    public string PlanType { get; set; } = "trial";
    public string SubscriptionStatus { get; set; } = "trial";
    public DateTime? TrialEndsAt { get; set; }
    public DateTime? SubscriptionExpiresAt { get; set; }
    public int DaysRemaining { get; set; }
    public bool IsWriteAllowed { get; set; }
    public string? CpfCnpj { get; set; }
    public bool GatewayConfigured { get; set; }
    public List<SubscriptionHistoryItemDto> History { get; set; } = new();
}

public class AsaasWebhookPayloadDto
{
    public string? Event { get; set; }
    public AsaasWebhookPaymentDto? Payment { get; set; }
}

public class AsaasWebhookPaymentDto
{
    public string? Id { get; set; }
    public string? Customer { get; set; }
    public decimal Value { get; set; }
    public string? Status { get; set; }
    public string? BillingType { get; set; }
    public string? ExternalReference { get; set; }
    public string? InvoiceUrl { get; set; }
}
