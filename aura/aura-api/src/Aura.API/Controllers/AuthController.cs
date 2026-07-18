using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Aura.Application.DTOs.Auth;
using Aura.Application.Services;

namespace Aura.API.Controllers;

[Route("api/auth")]
public class AuthController : BaseApiController
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService) => _authService = authService;

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequestDto dto)
    {
        var result = await _authService.LoginAsync(dto);
        return Ok(result);
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterRequestDto dto)
    {
        var result = await _authService.RegisterAsync(dto);
        return Created("", result);
    }

    [HttpGet("profile")]
    public async Task<ActionResult<ProfessorResponseDto>> GetProfile()
    {
        var result = await _authService.GetProfileAsync(GetProfessorId());
        return Ok(result);
    }

    [HttpPut("profile")]
    public async Task<ActionResult<ProfessorResponseDto>> UpdateProfile([FromBody] UpdateProfessorDto dto)
    {
        var result = await _authService.UpdateProfileAsync(GetProfessorId(), dto);
        return Ok(result);
    }
}
