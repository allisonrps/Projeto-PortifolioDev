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

    [HttpPost("manual")]
    public async Task<ActionResult<ManualFinanceEntryDto>> CreateManualEntry([FromBody] CreateManualFinanceEntryDto dto)
    {
        var result = await _financeService.CreateManualEntryAsync(GetProfessorId(), dto);
        return Ok(result);
    }

    [HttpDelete("manual/{id:guid}")]
    public async Task<IActionResult> DeleteManualEntry(Guid id)
    {
        await _financeService.DeleteManualEntryAsync(id, GetProfessorId());
        return NoContent();
    }
}
