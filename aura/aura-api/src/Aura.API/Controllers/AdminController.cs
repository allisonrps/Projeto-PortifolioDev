using Microsoft.AspNetCore.Mvc;
using Aura.Application.DTOs.Admin;
using Aura.Application.Services;

namespace Aura.API.Controllers;

[Route("api/admin")]
public class AdminController : BaseApiController
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<AdminDashboardDto>> GetDashboard()
    {
        var result = await _adminService.GetAdminDashboardAsync(GetProfessorId());
        return Ok(result);
    }

    [HttpPost("professors/{targetProfessorId:guid}/license")]
    public async Task<ActionResult<AdminDashboardDto>> UpdateProfessorLicense(
        Guid targetProfessorId,
        [FromBody] AdminUpdateLicenseDto dto)
    {
        var result = await _adminService.UpdateProfessorLicenseAsync(GetProfessorId(), targetProfessorId, dto);
        return Ok(result);
    }

    [HttpPost("pre-activate-email")]
    public async Task<ActionResult<AdminDashboardDto>> PreActivateEmail([FromBody] AdminPreActivateEmailDto dto)
    {
        var result = await _adminService.PreActivateOrAssignEmailAsync(GetProfessorId(), dto);
        return Ok(result);
    }

    [HttpPost("gateway-config")]
    public async Task<ActionResult<AdminDashboardDto>> UpdateGatewayConfig([FromBody] AdminGatewayConfigDto dto)
    {
        var result = await _adminService.UpdateGatewayConfigAsync(GetProfessorId(), dto);
        return Ok(result);
    }
}
