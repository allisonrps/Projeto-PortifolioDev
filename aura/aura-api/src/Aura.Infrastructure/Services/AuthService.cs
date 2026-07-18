using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AutoMapper;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Aura.Application.DTOs.Auth;
using Aura.Application.Services;
using Aura.Domain.Entities;
using Aura.Domain.Interfaces;

namespace Aura.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly IProfessorRepository _professorRepo;
    private readonly IConfiguration _config;
    private readonly IMapper _mapper;

    public AuthService(IProfessorRepository professorRepo, IConfiguration config, IMapper mapper)
    {
        _professorRepo = professorRepo;
        _config = config;
        _mapper = mapper;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto)
    {
        if (dto.Password != dto.ConfirmPassword)
            throw new ArgumentException("As senhas não coincidem.");

        var existing = await _professorRepo.GetByEmailAsync(dto.Email);
        if (existing != null)
            throw new ArgumentException("Este email já está cadastrado.");

        var professor = new Professor
        {
            Name = dto.Name,
            Email = dto.Email.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
        };

        await _professorRepo.AddAsync(professor);

        return new AuthResponseDto
        {
            Token = GenerateJwtToken(professor),
            Professor = _mapper.Map<ProfessorResponseDto>(professor)
        };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto dto)
    {
        var professor = await _professorRepo.GetByEmailAsync(dto.Email.ToLower())
            ?? throw new UnauthorizedAccessException("Email ou senha inválidos.");

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, professor.PasswordHash))
            throw new UnauthorizedAccessException("Email ou senha inválidos.");

        return new AuthResponseDto
        {
            Token = GenerateJwtToken(professor),
            Professor = _mapper.Map<ProfessorResponseDto>(professor)
        };
    }

    public async Task<ProfessorResponseDto> GetProfileAsync(Guid professorId)
    {
        var professor = await _professorRepo.GetByIdAsync(professorId)
            ?? throw new KeyNotFoundException("Professor não encontrado.");
        return _mapper.Map<ProfessorResponseDto>(professor);
    }

    public async Task<ProfessorResponseDto> UpdateProfileAsync(Guid professorId, UpdateProfessorDto dto)
    {
        var professor = await _professorRepo.GetByIdAsync(professorId)
            ?? throw new KeyNotFoundException("Professor não encontrado.");

        if (dto.Name != null) professor.Name = dto.Name;
        if (dto.Phone != null) professor.Phone = dto.Phone;
        if (dto.Theme != null) professor.Theme = dto.Theme;
        if (dto.PrimaryColor != null) professor.PrimaryColor = dto.PrimaryColor;
        if (dto.SecondaryColor != null) professor.SecondaryColor = dto.SecondaryColor;

        await _professorRepo.UpdateAsync(professor);
        return _mapper.Map<ProfessorResponseDto>(professor);
    }

    private string GenerateJwtToken(Professor professor)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["JwtSettings:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiryDays = int.Parse(_config["JwtSettings:ExpiryDays"] ?? "7");

        var claims = new[]
        {
            new Claim("Id", professor.Id.ToString()),
            new Claim(ClaimTypes.Email, professor.Email),
            new Claim(ClaimTypes.Name, professor.Name)
        };

        var token = new JwtSecurityToken(
            issuer: _config["JwtSettings:Issuer"],
            audience: _config["JwtSettings:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(expiryDays),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
