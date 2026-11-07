namespace Aura.Domain.Entities;

public class Professor : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? CpfCnpj { get; set; }
    public string? PhotoUrl { get; set; }
    public string Theme { get; set; } = "dark";
    public string PrimaryColor { get; set; } = "#7C3AED";
    public string SecondaryColor { get; set; } = "#06B6D4";
    public string PlanType { get; set; } = "trial";
    public string SubscriptionStatus { get; set; } = "trial";
    public DateTime? TrialEndsAt { get; set; }
    public DateTime? SubscriptionExpiresAt { get; set; }
    public string? AsaasCustomerId { get; set; }
    public bool IsAdmin { get; set; } = false;
    public string VisualTheme { get; set; } = "classic";

    public virtual ICollection<Student> Students { get; set; } = new List<Student>();
    public virtual ICollection<Subject> Subjects { get; set; } = new List<Subject>();
    public virtual ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
    public virtual ICollection<Schedule> Schedules { get; set; } = new List<Schedule>();
    public virtual ICollection<Holiday> Holidays { get; set; } = new List<Holiday>();
    public virtual ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
}
