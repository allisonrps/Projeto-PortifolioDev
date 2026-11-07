using System.Net;
using System.Text.Json;
using Aura.Domain.Interfaces;

namespace Aura.API.Middleware;

public class SubscriptionWriteGuardMiddleware
{
    private readonly RequestDelegate _next;

    public SubscriptionWriteGuardMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IProfessorRepository professorRepo)
    {
        var method = context.Request.Method;

        // Sempre liberar leitura (GET, HEAD, OPTIONS)
        if (HttpMethods.IsGet(method) || HttpMethods.IsHead(method) || HttpMethods.IsOptions(method))
        {
            await _next(context);
            return;
        }

        var path = context.Request.Path.Value?.ToLowerInvariant() ?? string.Empty;

        // Sempre liberar rotas de autenticação, perfil, assinatura, administração e rotas públicas de atividades
        if (path.StartsWith("/api/auth") ||
            path.StartsWith("/api/subscriptions") ||
            path.StartsWith("/api/admin") ||
            path.Contains("/public/") ||
            path.StartsWith("/api/activities/student/"))
        {
            await _next(context);
            return;
        }

        var idClaim = context.User?.FindFirst("Id")?.Value;
        if (Guid.TryParse(idClaim, out var professorId))
        {
            var professor = await professorRepo.GetByIdAsync(professorId);
            if (professor != null)
            {
                if (professor.IsAdmin)
                {
                    await _next(context);
                    return;
                }

                var now = DateTime.UtcNow;
                var isBlocked = professor.SubscriptionStatus == "blocked";
                var hasLifetime = professor.PlanType == "lifetime" && professor.SubscriptionStatus == "active";
                var hasActiveSubscription = !isBlocked && (hasLifetime || (professor.SubscriptionExpiresAt.HasValue && professor.SubscriptionExpiresAt.Value > now));
                var trialEnds = professor.TrialEndsAt ?? now.AddDays(14);
                var hasActiveTrial = !isBlocked && trialEnds > now;

                if (!hasActiveSubscription && !hasActiveTrial)
                {
                    context.Response.StatusCode = (int)HttpStatusCode.PaymentRequired; // 402
                    context.Response.ContentType = "application/json";
                    var response = JsonSerializer.Serialize(new
                    {
                        error = "Seu período de teste ou assinatura expirou. O sistema está em modo somente leitura. Ative seu plano em Configurações > Planos e Assinatura para criar ou editar registros.",
                        message = "Seu período de teste ou assinatura expirou. Ative seu plano em Configurações > Planos e Assinatura para criar ou editar registros.",
                        code = "SUBSCRIPTION_EXPIRED"
                    });
                    await context.Response.WriteAsync(response);
                    return;
                }
            }
        }

        await _next(context);
    }
}
