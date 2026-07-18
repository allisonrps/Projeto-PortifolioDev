namespace Aura.Domain.Entities;

public class Lesson : BaseEntity
{
    public Guid StudentId { get; set; }
    public Guid ProfessorId { get; set; }
    public string? Title { get; set; }
    public DateTime ScheduledAt { get; set; }
    public int DurationMinutes { get; set; } = 60;
    public string Status { get; set; } = "scheduled";
    public string? Notes { get; set; }

    public virtual Student Student { get; set; } = null!;
    public virtual Professor Professor { get; set; } = null!;
}
