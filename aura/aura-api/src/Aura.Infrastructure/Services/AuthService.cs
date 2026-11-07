using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AutoMapper;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Aura.Application.DTOs.Auth;
using Aura.Application.Services;
using Aura.Domain.Entities;
using Aura.Domain.Interfaces;

namespace Aura.Infrastructure.Services;

public class AuthService : IAuthService
{
    public const string ExclusiveAdminEmail = "allison_rps@hotmail.com";

    private readonly IProfessorRepository _professorRepo;
    private readonly ISubjectRepository _subjectRepo;
    private readonly ILevelRepository _levelRepo;
    private readonly ISubscriptionRepository _subscriptionRepo;
    private readonly IConfiguration _config;
    private readonly IMapper _mapper;
    private readonly ILogger<AuthService> _logger;

    private static readonly HashSet<string> PreActivatedAnnualEmails = new(StringComparer.OrdinalIgnoreCase)
    {
        "fernandasanaiotinogueira@gmail.com"
    };

    public AuthService(
        IProfessorRepository professorRepo,
        ISubjectRepository subjectRepo,
        ILevelRepository levelRepo,
        ISubscriptionRepository subscriptionRepo,
        IConfiguration config,
        IMapper mapper,
        ILogger<AuthService> logger)
    {
        _professorRepo = professorRepo;
        _subjectRepo = subjectRepo;
        _levelRepo = levelRepo;
        _subscriptionRepo = subscriptionRepo;
        _config = config;
        _mapper = mapper;
        _logger = logger;
    }

    public static bool IsDeveloperAdmin(Professor professor)
        => string.Equals(professor.Email?.Trim(), ExclusiveAdminEmail, StringComparison.OrdinalIgnoreCase);

    public static ProfessorResponseDto EnrichProfessorDto(Professor professor, ProfessorResponseDto dto)
    {
        var now = DateTime.UtcNow;
        var isDevAdmin = IsDeveloperAdmin(professor);
        dto.IsAdmin = isDevAdmin;

        if (isDevAdmin)
        {
            dto.PlanType = "lifetime";
            dto.SubscriptionStatus = "active";
            dto.DaysRemaining = 9999;
            dto.IsWriteAllowed = true;
            return dto;
        }

        if (professor.SubscriptionStatus == "blocked")
        {
            dto.SubscriptionStatus = "blocked";
            dto.DaysRemaining = 0;
            dto.IsWriteAllowed = false;
            return dto;
        }

        if (professor.PlanType == "lifetime" && professor.SubscriptionStatus == "active")
        {
            dto.PlanType = "lifetime";
            dto.SubscriptionStatus = "active";
            dto.DaysRemaining = 9999;
            dto.IsWriteAllowed = true;
            return dto;
        }

        if (professor.SubscriptionExpiresAt.HasValue && professor.SubscriptionExpiresAt.Value > now)
        {
            dto.SubscriptionStatus = "active";
            dto.DaysRemaining = Math.Max(1, (int)Math.Ceiling((professor.SubscriptionExpiresAt.Value - now).TotalDays));
            dto.IsWriteAllowed = true;
            return dto;
        }

        var trialEnds = professor.TrialEndsAt ?? now.AddDays(14);
        dto.TrialEndsAt = trialEnds;

        if (trialEnds > now)
        {
            dto.PlanType = "trial";
            dto.SubscriptionStatus = "trial";
            dto.DaysRemaining = Math.Max(1, (int)Math.Ceiling((trialEnds - now).TotalDays));
            dto.IsWriteAllowed = true;
        }
        else
        {
            dto.SubscriptionStatus = "expired";
            dto.DaysRemaining = 0;
            dto.IsWriteAllowed = false;
        }

        return dto;
    }

    private async Task EnsureSpecialRulesAsync(Professor professor)
    {
        var updated = false;
        var isDevAdmin = IsDeveloperAdmin(professor);

        // 1. Exclusividade do Painel Admin para allison_rps@hotmail.com
        if (professor.IsAdmin != isDevAdmin)
        {
            professor.IsAdmin = isDevAdmin;
            updated = true;
        }

        if (isDevAdmin && (professor.PlanType != "lifetime" || professor.SubscriptionStatus != "active"))
        {
            professor.PlanType = "lifetime";
            professor.SubscriptionStatus = "active";
            professor.SubscriptionExpiresAt = DateTime.UtcNow.AddYears(50);
            updated = true;
        }

        // 2. Regra de licença anual pré-ativada (fernandasanaiotinogueira@gmail.com)
        if (PreActivatedAnnualEmails.Contains(professor.Email))
        {
            var now = DateTime.UtcNow;
            if (professor.SubscriptionStatus != "active" ||
                professor.PlanType != "annual" ||
                !professor.SubscriptionExpiresAt.HasValue ||
                professor.SubscriptionExpiresAt.Value < now.AddDays(30))
            {
                var endDate = now.AddDays(365);
                professor.PlanType = "annual";
                professor.SubscriptionStatus = "active";
                professor.SubscriptionExpiresAt = endDate;
                updated = true;

                var existingSubs = await _subscriptionRepo.GetByProfessorIdAsync(professor.Id);
                if (!existingSubs.Any(s => s.Status == "active" && s.PlanType == "annual"))
                {
                    await _subscriptionRepo.AddAsync(new Subscription
                    {
                        ProfessorId = professor.Id,
                        PlanType = "annual",
                        Price = 299.00m,
                        Status = "active",
                        BillingType = "MANUAL_LICENSE",
                        StartDate = now,
                        EndDate = endDate,
                        PaymentGatewayId = $"preactivated_{professor.Id:N}"
                    });
                }
            }
        }

        // 3. Inicialização de Trial para contas comuns antigas
        if (!isDevAdmin && !professor.TrialEndsAt.HasValue && !professor.SubscriptionExpiresAt.HasValue)
        {
            professor.TrialEndsAt = DateTime.UtcNow.AddDays(14);
            professor.PlanType = "trial";
            professor.SubscriptionStatus = "trial";
            updated = true;
        }

        if (updated)
        {
            await _professorRepo.UpdateAsync(professor);
        }
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Name))
            throw new ArgumentException("Nome e e-mail são obrigatórios.");

        if (string.IsNullOrEmpty(dto.Password) || dto.Password.Length < 6)
            throw new ArgumentException("A senha deve ter no mínimo 6 caracteres.");

        if (Encoding.UTF8.GetByteCount(dto.Password) > 72)
            throw new ArgumentException("A senha deve ter no máximo 72 caracteres.");

        if (dto.Password != dto.ConfirmPassword)
            throw new ArgumentException("As senhas não coincidem.");

        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        var existing = await _professorRepo.GetByEmailAsync(normalizedEmail);
        if (existing != null)
            throw new ArgumentException("Este email já está cadastrado.");

        var isPreActivatedAnnual = PreActivatedAnnualEmails.Contains(normalizedEmail);
        var isDevAdmin = string.Equals(normalizedEmail, ExclusiveAdminEmail, StringComparison.OrdinalIgnoreCase);
        var now = DateTime.UtcNow;

        var professor = new Professor
        {
            Name = dto.Name.Trim(),
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            PlanType = isDevAdmin ? "lifetime" : isPreActivatedAnnual ? "annual" : "trial",
            SubscriptionStatus = (isDevAdmin || isPreActivatedAnnual) ? "active" : "trial",
            TrialEndsAt = now.AddDays(14),
            SubscriptionExpiresAt = isDevAdmin ? now.AddYears(50) : isPreActivatedAnnual ? now.AddDays(365) : null,
            IsAdmin = isDevAdmin
        };

        await _professorRepo.AddAsync(professor);
        await EnsureSpecialRulesAsync(professor);
        _logger.LogInformation("Novo professor registrado: {ProfessorId} ({Email}) - Plano: {PlanType}", professor.Id, normalizedEmail, professor.PlanType);

        // Create default Subject & Level for new Professor
        var defaultSubject = new Subject
        {
            ProfessorId = professor.Id,
            Name = "Geral"
        };
        await _subjectRepo.AddAsync(defaultSubject);

        var defaultLevel = new Level
        {
            SubjectId = defaultSubject.Id,
            Name = "Geral"
        };
        await _levelRepo.AddAsync(defaultLevel);

        var profDto = EnrichProfessorDto(professor, _mapper.Map<ProfessorResponseDto>(professor));

        return new AuthResponseDto
        {
            Token = GenerateJwtToken(professor),
            Professor = profDto
        };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto dto)
    {
        var normalizedEmail = (dto.Email ?? string.Empty).Trim().ToLowerInvariant();
        var professor = await _professorRepo.GetByEmailAsync(normalizedEmail);

        if (professor == null || !BCrypt.Net.BCrypt.Verify(dto.Password ?? string.Empty, professor.PasswordHash))
        {
            _logger.LogWarning("Tentativa de login inválida para o e-mail: {Email}", normalizedEmail);
            throw new UnauthorizedAccessException("Email ou senha inválidos.");
        }

        await EnsureSpecialRulesAsync(professor);

        _logger.LogInformation("Login realizado com sucesso pelo professor {ProfessorId}", professor.Id);

        var profDto = EnrichProfessorDto(professor, _mapper.Map<ProfessorResponseDto>(professor));

        return new AuthResponseDto
        {
            Token = GenerateJwtToken(professor),
            Professor = profDto
        };
    }

    public async Task<ProfessorResponseDto> GetProfileAsync(Guid professorId)
    {
        var professor = await _professorRepo.GetByIdAsync(professorId)
            ?? throw new KeyNotFoundException("Professor não encontrado.");

        await EnsureSpecialRulesAsync(professor);

        return EnrichProfessorDto(professor, _mapper.Map<ProfessorResponseDto>(professor));
    }

    public async Task<ProfessorResponseDto> UpdateProfileAsync(Guid professorId, UpdateProfessorDto dto)
    {
        var professor = await _professorRepo.GetByIdAsync(professorId)
            ?? throw new KeyNotFoundException("Professor não encontrado.");

        if (dto.Name != null) professor.Name = dto.Name.Trim();
        if (dto.Phone != null) professor.Phone = dto.Phone.Trim();
        if (dto.CpfCnpj != null) professor.CpfCnpj = dto.CpfCnpj.Trim();
        if (dto.Theme != null) professor.Theme = dto.Theme;
        if (dto.PrimaryColor != null) professor.PrimaryColor = dto.PrimaryColor;
        if (dto.SecondaryColor != null) professor.SecondaryColor = dto.SecondaryColor;
        if (dto.VisualTheme != null) professor.VisualTheme = dto.VisualTheme;

        await _professorRepo.UpdateAsync(professor);
        return EnrichProfessorDto(professor, _mapper.Map<ProfessorResponseDto>(professor));
    }

    public async Task ChangePasswordAsync(Guid professorId, ChangePasswordDto dto)
    {
        var professor = await _professorRepo.GetByIdAsync(professorId)
            ?? throw new KeyNotFoundException("Professor não encontrado.");

        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, professor.PasswordHash))
        {
            _logger.LogWarning("Falha ao alterar senha para o professor {ProfessorId}: senha atual incorreta.", professorId);
            throw new UnauthorizedAccessException("A senha atual fornecida está incorreta.");
        }

        if (string.IsNullOrEmpty(dto.NewPassword) || dto.NewPassword.Length < 6)
            throw new ArgumentException("A nova senha deve ter no mínimo 6 caracteres.");

        if (Encoding.UTF8.GetByteCount(dto.NewPassword) > 72)
            throw new ArgumentException("A nova senha deve ter no máximo 72 caracteres.");

        if (dto.NewPassword != dto.ConfirmNewPassword)
            throw new ArgumentException("A nova senha e a confirmação não coincidem.");

        professor.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        await _professorRepo.UpdateAsync(professor);
        _logger.LogInformation("Senha alterada com sucesso para o professor {ProfessorId}.", professorId);
    }

    private string GenerateJwtToken(Professor professor)
    {
        var jwtKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY")
                     ?? _config["JwtSettings:Key"]
                     ?? throw new InvalidOperationException("Chave JWT não configurada.");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
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
