using Microsoft.AspNetCore.Mvc;
using Aura.Application.DTOs.Dashboard;
using Aura.Application.Services;

namespace Aura.API.Controllers;

[Route("api/finance")]
public class FinanceController : BaseApiController
{
    private readonly IFinanceService _financeService;

    public FinanceController(IFinanceService financeService)
    {
        _financeService = financeService;
    }

    [HttpGet]
    public async Task<ActionResult<FinanceDto>> GetFinanceData([FromQuery] int? month, [FromQuery] int? year)
    {
        var result = await _financeService.GetFinanceDataAsync(GetProfessorId(), month, year);
        return Ok(result);
    }
}
