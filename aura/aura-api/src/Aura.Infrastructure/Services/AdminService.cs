using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Aura.Application.DTOs.Admin;
using Aura.Application.DTOs.Auth;
using Aura.Application.Services;
using Aura.Domain.Entities;
using Aura.Domain.Interfaces;
using Aura.Infrastructure.Data;

namespace Aura.Infrastructure.Services;

public class AdminService : IAdminService
{
    private readonly AuraDbContext _context;
    private readonly IProfessorRepository _professorRepo;
    private readonly ISubscriptionRepository _subscriptionRepo;
    private readonly ISubjectRepository _subjectRepo;
    private readonly ILevelRepository _levelRepo;
    private readonly IConfiguration _config;
    private readonly ILogger<AdminService> _logger;

    public AdminService(
        AuraDbContext context,
        IProfessorRepository professorRepo,
        ISubscriptionRepository subscriptionRepo,
        ISubjectRepository subjectRepo,
        ILevelRepository levelRepo,
        IConfiguration config,
        ILogger<AdminService> logger)
    {
        _context = context;
        _professorRepo = professorRepo;
        _subscriptionRepo = subscriptionRepo;
        _subjectRepo = subjectRepo;
        _levelRepo = levelRepo;
        _config = config;
        _logger = logger;
    }

    private async Task<string?> ResolveGatewayKeyAsync()
    {
        var envKey = Environment.GetEnvironmentVariable("ASAAS_API_KEY")
                     ?? _config["Asaas:ApiKey"];
        if (!string.IsNullOrWhiteSpace(envKey))
            return envKey.Trim();

        try
        {
            var setting = await _context.PlatformSettings
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Key == "ASAAS_API_KEY");
            if (!string.IsNullOrWhiteSpace(setting?.Value))
                return setting.Value.Trim();
        }
        catch
        {
            // ignore if table not ready
        }

        return null;
    }

    private static string? MaskKey(string? key)
    {
        if (string.IsNullOrWhiteSpace(key)) return null;
        var k = key.Trim();
        if (k.Length <= 18) return "••••••••";
        return $"{k[..14]}••••••••{k[^6..]}";
    }

    private async Task EnsureRequesterIsAdminAsync(Guid requesterId)
    {
        var requester = await _professorRepo.GetByIdAsync(requesterId)
            ?? throw new UnauthorizedAccessException("Usuário não encontrado.");

        if (!AuthService.IsDeveloperAdmin(requester))
        {
            throw new UnauthorizedAccessException("Acesso exclusivo do desenvolvedor da plataforma (allison_rps@hotmail.com).");
        }
    }

    public async Task<AdminDashboardDto> GetAdminDashboardAsync(Guid requesterProfessorId)
    {
        await EnsureRequesterIsAdminAsync(requesterProfessorId);

        var professors = await _context.Professors
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        var studentStatsByProf = await _context.Students
            .GroupBy(s => s.ProfessorId)
            .Select(g => new
            {
                ProfessorId = g.Key,
                Total = g.Count(),
                Active = g.Count(s => s.IsActive)
            })
            .ToDictionaryAsync(x => x.ProfessorId);

        var lessonCountsByProf = await _context.Lessons
            .GroupBy(l => l.ProfessorId)
            .Select(g => new { ProfessorId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ProfessorId, x => x.Count);

        var activityCountsByProf = await _context.TemplateActivities
            .GroupBy(a => a.ProfessorId)
            .Select(g => new { ProfessorId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ProfessorId, x => x.Count);

        var subscriptions = await _context.Subscriptions
            .Include(s => s.Professor)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        var paidSumsByProf = subscriptions
            .Where(s => s.Status == "active")
            .GroupBy(s => s.ProfessorId)
            .ToDictionary(g => g.Key, g => g.Sum(s => s.Price));

        var profItems = new List<AdminProfessorItemDto>(professors.Count);
        int activeSubscribers = 0;
        int monthlySubscribers = 0;
        int annualSubscribers = 0;
        int lifetimeSubscribers = 0;
        int trialProfessors = 0;
        int expiredOrBlocked = 0;

        foreach (var prof in professors)
        {
            var enriched = AuthService.EnrichProfessorDto(prof, new ProfessorResponseDto
            {
                Id = prof.Id,
                Name = prof.Name,
                Email = prof.Email,
                Phone = prof.Phone,
                CpfCnpj = prof.CpfCnpj,
                PlanType = prof.PlanType,
                SubscriptionStatus = prof.SubscriptionStatus,
                TrialEndsAt = prof.TrialEndsAt,
                SubscriptionExpiresAt = prof.SubscriptionExpiresAt,
                IsAdmin = prof.IsAdmin
            });

            if (enriched.SubscriptionStatus == "active")
            {
                activeSubscribers++;
                if (enriched.PlanType == "annual") annualSubscribers++;
                else if (enriched.PlanType == "lifetime") lifetimeSubscribers++;
                else monthlySubscribers++;
            }
            else if (enriched.SubscriptionStatus == "trial")
            {
                trialProfessors++;
            }
            else
            {
                expiredOrBlocked++;
            }

            studentStatsByProf.TryGetValue(prof.Id, out var stStat);
            lessonCountsByProf.TryGetValue(prof.Id, out var lCount);
            activityCountsByProf.TryGetValue(prof.Id, out var aCount);
            paidSumsByProf.TryGetValue(prof.Id, out var totalPaid);

            profItems.Add(new AdminProfessorItemDto
            {
                Id = prof.Id,
                Name = prof.Name,
                Email = prof.Email,
                Phone = prof.Phone,
                CpfCnpj = prof.CpfCnpj,
                IsAdmin = enriched.IsAdmin,
                PlanType = enriched.PlanType,
                SubscriptionStatus = enriched.SubscriptionStatus,
                TrialEndsAt = enriched.TrialEndsAt,
                SubscriptionExpiresAt = enriched.SubscriptionExpiresAt,
                DaysRemaining = enriched.DaysRemaining,
                IsWriteAllowed = enriched.IsWriteAllowed,
                StudentsCount = stStat?.Total ?? 0,
                ActiveStudentsCount = stStat?.Active ?? 0,
                LessonsCount = lCount,
                ActivitiesCount = aCount,
                TotalPaidAmount = totalPaid,
                CreatedAt = prof.CreatedAt
            });
        }

        var mrr = Math.Round((monthlySubscribers * SubscriptionService.MonthlyPlanPrice) + (annualSubscribers * (SubscriptionService.AnnualPlanPrice / 12m)), 2);
        var arr = Math.Round(mrr * 12m, 2);
        var totalRevenue = subscriptions.Where(s => s.Status == "active").Sum(s => s.Price);
        var gatewayKey = await ResolveGatewayKeyAsync();
        var gatewayConfigured = !string.IsNullOrEmpty(gatewayKey);
        var gatewayEnv = !gatewayConfigured
            ? "none"
            : gatewayKey!.Contains("hmlg", StringComparison.OrdinalIgnoreCase)
                ? "sandbox"
                : "production";

        return new AdminDashboardDto
        {
            TotalProfessors = professors.Count,
            ActiveSubscribersCount = activeSubscribers,
            MonthlySubscribersCount = monthlySubscribers,
            AnnualSubscribersCount = annualSubscribers,
            LifetimeSubscribersCount = lifetimeSubscribers,
            TrialProfessorsCount = trialProfessors,
            ExpiredOrBlockedCount = expiredOrBlocked,
            Mrr = mrr,
            Arr = arr,
            TotalPlatformRevenue = totalRevenue,
            TotalPlatformStudents = studentStatsByProf.Values.Sum(v => v.Total),
            TotalPlatformLessons = lessonCountsByProf.Values.Sum(),
            TotalPlatformActivities = activityCountsByProf.Values.Sum(),
            GatewayConfigured = gatewayConfigured,
            GatewayEnvironment = gatewayEnv,
            MaskedGatewayKey = MaskKey(gatewayKey),
            Professors = profItems,
            RecentSubscriptions = subscriptions.Take(100).Select(s => new AdminSubscriptionItemDto
            {
                Id = s.Id,
                ProfessorId = s.ProfessorId,
                ProfessorName = s.Professor?.Name ?? "Professor",
                ProfessorEmail = s.Professor?.Email ?? string.Empty,
                PlanType = s.PlanType,
                Price = s.Price,
                Status = s.Status,
                BillingType = s.BillingType,
                StartDate = s.StartDate,
                EndDate = s.EndDate,
                PaymentGatewayId = s.PaymentGatewayId,
                InvoiceUrl = s.InvoiceUrl,
                CreatedAt = s.CreatedAt
            }).ToList()
        };
    }

    public async Task<AdminDashboardDto> UpdateProfessorLicenseAsync(Guid requesterProfessorId, Guid targetProfessorId, AdminUpdateLicenseDto dto)
    {
        await EnsureRequesterIsAdminAsync(requesterProfessorId);

        var target = await _professorRepo.GetByIdAsync(targetProfessorId)
            ?? throw new KeyNotFoundException("Professor não encontrado.");

        var now = DateTime.UtcNow;
        var action = (dto.Action ?? string.Empty).ToLowerInvariant();

        switch (action)
        {
            case "activate_monthly":
            {
                var baseDate = target.SubscriptionExpiresAt.HasValue && target.SubscriptionExpiresAt.Value > now
                    ? target.SubscriptionExpiresAt.Value
                    : now;
                var endDate = baseDate.AddDays(30);
                target.PlanType = "monthly";
                target.SubscriptionStatus = "active";
                target.SubscriptionExpiresAt = endDate;

                if (dto.RecordRevenue)
                {
                    await _subscriptionRepo.AddAsync(new Subscription
                    {
                        ProfessorId = target.Id,
                        PlanType = "monthly",
                        Price = SubscriptionService.MonthlyPlanPrice,
                        Status = "active",
                        BillingType = "MANUAL_ADMIN",
                        StartDate = now,
                        EndDate = endDate,
                        PaymentGatewayId = $"admin_monthly_{Guid.NewGuid():N}"
                    });
                }
                break;
            }
            case "activate_annual":
            {
                var baseDate = target.SubscriptionExpiresAt.HasValue && target.SubscriptionExpiresAt.Value > now
                    ? target.SubscriptionExpiresAt.Value
                    : now;
                var endDate = baseDate.AddDays(365);
                target.PlanType = "annual";
                target.SubscriptionStatus = "active";
                target.SubscriptionExpiresAt = endDate;

                if (dto.RecordRevenue)
                {
                    await _subscriptionRepo.AddAsync(new Subscription
                    {
                        ProfessorId = target.Id,
                        PlanType = "annual",
                        Price = SubscriptionService.AnnualPlanPrice,
                        Status = "active",
                        BillingType = "MANUAL_ADMIN",
                        StartDate = now,
                        EndDate = endDate,
                        PaymentGatewayId = $"admin_annual_{Guid.NewGuid():N}"
                    });
                }
                break;
            }
            case "activate_lifetime":
            {
                var endDate = now.AddYears(50);
                target.PlanType = "lifetime";
                target.SubscriptionStatus = "active";
                target.SubscriptionExpiresAt = endDate;
                break;
            }
            case "extend_trial":
            {
                var days = dto.CustomDays.HasValue && dto.CustomDays.Value > 0 ? dto.CustomDays.Value : 14;
                var baseTrial = target.TrialEndsAt.HasValue && target.TrialEndsAt.Value > now
                    ? target.TrialEndsAt.Value
                    : now;
                target.PlanType = "trial";
                target.SubscriptionStatus = "trial";
                target.TrialEndsAt = baseTrial.AddDays(days);
                target.SubscriptionExpiresAt = null;
                break;
            }
            case "block":
            {
                if (AuthService.IsDeveloperAdmin(target))
                    throw new ArgumentException("A conta exclusiva do desenvolvedor não pode ser bloqueada.");

                target.SubscriptionStatus = "blocked";
                target.SubscriptionExpiresAt = now.AddDays(-1);
                target.TrialEndsAt = now.AddDays(-1);
                break;
            }
            default:
                throw new ArgumentException("Ação administrativa inválida.");
        }

        await _professorRepo.UpdateAsync(target);
        _logger.LogInformation("Admin {AdminId} executou '{Action}' para o professor {TargetId} ({Email})", requesterProfessorId, action, target.Id, target.Email);

        return await GetAdminDashboardAsync(requesterProfessorId);
    }

    public async Task<AdminDashboardDto> PreActivateOrAssignEmailAsync(Guid requesterProfessorId, AdminPreActivateEmailDto dto)
    {
        await EnsureRequesterIsAdminAsync(requesterProfessorId);

        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        var planType = (dto.PlanType ?? "annual").ToLowerInvariant();
        var now = DateTime.UtcNow;

        var professor = await _professorRepo.GetByEmailAsync(normalizedEmail);
        var isNewProfessor = false;

        if (professor == null)
        {
            isNewProfessor = true;
            var pwd = string.IsNullOrWhiteSpace(dto.InitialPassword) ? "Aura@123" : dto.InitialPassword.Trim();
            professor = new Professor
            {
                Name = string.IsNullOrWhiteSpace(dto.Name) ? normalizedEmail.Split('@')[0] : dto.Name.Trim(),
                Email = normalizedEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(pwd),
                TrialEndsAt = now.AddDays(14)
            };
            await _professorRepo.AddAsync(professor);

            var defaultSubject = new Subject { ProfessorId = professor.Id, Name = "Geral" };
            await _subjectRepo.AddAsync(defaultSubject);
            await _levelRepo.AddAsync(new Level { SubjectId = defaultSubject.Id, Name = "Geral" });
        }
        else if (!string.IsNullOrWhiteSpace(dto.Name))
        {
            professor.Name = dto.Name.Trim();
        }

        if (planType == "lifetime")
        {
            professor.PlanType = "lifetime";
            professor.SubscriptionStatus = "active";
            professor.SubscriptionExpiresAt = now.AddYears(50);
        }
        else if (planType == "monthly")
        {
            var endDate = now.AddDays(30);
            professor.PlanType = "monthly";
            professor.SubscriptionStatus = "active";
            professor.SubscriptionExpiresAt = endDate;
            await _subscriptionRepo.AddAsync(new Subscription
            {
                ProfessorId = professor.Id,
                PlanType = "monthly",
                Price = SubscriptionService.MonthlyPlanPrice,
                Status = "active",
                BillingType = "MANUAL_ADMIN",
                StartDate = now,
                EndDate = endDate,
                PaymentGatewayId = $"admin_pre_{Guid.NewGuid():N}"
            });
        }
        else
        {
            var endDate = now.AddDays(365);
            professor.PlanType = "annual";
            professor.SubscriptionStatus = "active";
            professor.SubscriptionExpiresAt = endDate;
            await _subscriptionRepo.AddAsync(new Subscription
            {
                ProfessorId = professor.Id,
                PlanType = "annual",
                Price = SubscriptionService.AnnualPlanPrice,
                Status = "active",
                BillingType = "MANUAL_ADMIN",
                StartDate = now,
                EndDate = endDate,
                PaymentGatewayId = $"admin_pre_{Guid.NewGuid():N}"
            });
        }

        await _professorRepo.UpdateAsync(professor);
        _logger.LogInformation("Admin {AdminId} ativou licença '{PlanType}' para {Email} (Novo cadastro: {IsNew})",
            requesterProfessorId, planType, normalizedEmail, isNewProfessor);

        return await GetAdminDashboardAsync(requesterProfessorId);
    }

    public async Task<AdminDashboardDto> UpdateGatewayConfigAsync(Guid requesterProfessorId, AdminGatewayConfigDto dto)
    {
        await EnsureRequesterIsAdminAsync(requesterProfessorId);

        var trimmed = (dto.ApiKey ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            throw new ArgumentException("Informe uma chave de API do Asaas válida.");

        var existing = await _context.PlatformSettings.FirstOrDefaultAsync(s => s.Key == "ASAAS_API_KEY");
        if (existing == null)
        {
            _context.PlatformSettings.Add(new PlatformSetting
            {
                Key = "ASAAS_API_KEY",
                Value = trimmed,
                UpdatedAt = DateTime.UtcNow
            });
        }
        else
        {
            existing.Value = trimmed;
            existing.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        Environment.SetEnvironmentVariable("ASAAS_API_KEY", trimmed);
        _logger.LogInformation("Admin {AdminId} atualizou a chave do gateway Asaas no cofre seguro.", requesterProfessorId);

        return await GetAdminDashboardAsync(requesterProfessorId);
    }
}
