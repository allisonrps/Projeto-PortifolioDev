using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Aura.Application.DTOs.Subscription;
using Aura.Application.Services;

namespace Aura.API.Controllers;

[Route("api/subscriptions")]
public class SubscriptionsController : BaseApiController
{
    private readonly ISubscriptionService _subscriptionService;

    public SubscriptionsController(ISubscriptionService subscriptionService)
    {
        _subscriptionService = subscriptionService;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<SubscriptionSummaryDto>> GetSummary()
    {
        var result = await _subscriptionService.GetSummaryAsync(GetProfessorId());
        return Ok(result);
    }

    [HttpPost("checkout")]
    public async Task<ActionResult<SubscriptionCheckoutResponseDto>> CreateCheckout([FromBody] CreateCheckoutDto dto)
    {
        var result = await _subscriptionService.CreateCheckoutAsync(GetProfessorId(), dto);
        return Ok(result);
    }

    [HttpPost("{id:guid}/verify")]
    public async Task<ActionResult<SubscriptionSummaryDto>> VerifyStatus(Guid id, [FromQuery] bool simulateDemo = false)
    {
        var result = await _subscriptionService.VerifySubscriptionStatusAsync(GetProfessorId(), id, simulateDemo);
        return Ok(result);
    }

    [HttpPost("webhook/asaas")]
    [AllowAnonymous]
    [EnableRateLimiting("public")]
    public async Task<ActionResult> AsaasWebhook([FromBody] AsaasWebhookPayloadDto payload)
    {
        var tokenHeader = Request.Headers["asaas-access-token"].FirstOrDefault();
        await _subscriptionService.HandleAsaasWebhookAsync(payload, tokenHeader);
        return Ok(new { received = true });
    }
}
