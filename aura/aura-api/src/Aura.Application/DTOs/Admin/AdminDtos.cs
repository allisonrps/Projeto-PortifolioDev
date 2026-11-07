using System.ComponentModel.DataAnnotations;

namespace Aura.Application.DTOs.Admin;

public class AdminDashboardDto
{
    public int TotalProfessors { get; set; }
    public int ActiveSubscribersCount { get; set; }
    public int MonthlySubscribersCount { get; set; }
    public int AnnualSubscribersCount { get; set; }
    public int LifetimeSubscribersCount { get; set; }
    public int TrialProfessorsCount { get; set; }
    public int ExpiredOrBlockedCount { get; set; }
    public decimal Mrr { get; set; }
    public decimal Arr { get; set; }
    public decimal TotalPlatformRevenue { get; set; }
    public int TotalPlatformStudents { get; set; }
    public int TotalPlatformLessons { get; set; }
    public int TotalPlatformActivities { get; set; }
    public bool GatewayConfigured { get; set; }
    public string GatewayEnvironment { get; set; } = "none";
    public string? MaskedGatewayKey { get; set; }
    public List<AdminProfessorItemDto> Professors { get; set; } = new();
    public List<AdminSubscriptionItemDto> RecentSubscriptions { get; set; } = new();
}

public class AdminProfessorItemDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? CpfCnpj { get; set; }
    public bool IsAdmin { get; set; }
    public string PlanType { get; set; } = "trial";
    public string SubscriptionStatus { get; set; } = "trial";
    public DateTime? TrialEndsAt { get; set; }
    public DateTime? SubscriptionExpiresAt { get; set; }
    public int DaysRemaining { get; set; }
    public bool IsWriteAllowed { get; set; }
    public int StudentsCount { get; set; }
    public int ActiveStudentsCount { get; set; }
    public int LessonsCount { get; set; }
    public int ActivitiesCount { get; set; }
    public decimal TotalPaidAmount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminSubscriptionItemDto
{
    public Guid Id { get; set; }
    public Guid ProfessorId { get; set; }
    public string ProfessorName { get; set; } = string.Empty;
    public string ProfessorEmail { get; set; } = string.Empty;
    public string PlanType { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Status { get; set; } = string.Empty;
    public string BillingType { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? PaymentGatewayId { get; set; }
    public string? InvoiceUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminUpdateLicenseDto
{
    [Required]
    public string Action { get; set; } = string.Empty;

    public int? CustomDays { get; set; }

    public bool RecordRevenue { get; set; } = true;
}

public class AdminPreActivateEmailDto
{
    [Required(ErrorMessage = "O e-mail é obrigatório.")]
    [EmailAddress(ErrorMessage = "Informe um e-mail válido.")]
    [MaxLength(180)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(150)]
    public string? Name { get; set; }

    [Required]
    public string PlanType { get; set; } = "annual";

    [MaxLength(72)]
    public string? InitialPassword { get; set; }
}

public class AdminGatewayConfigDto
{
    [Required(ErrorMessage = "Informe a chave de API do Asaas.")]
    [MaxLength(500)]
    public string ApiKey { get; set; } = string.Empty;
}
