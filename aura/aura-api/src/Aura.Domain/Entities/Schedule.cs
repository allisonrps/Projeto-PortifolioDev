namespace Aura.Domain.Entities;

public class Schedule : BaseEntity
{
    public Guid ProfessorId { get; set; }
    public Guid StudentId { get; set; }
    public int DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public bool IsRecurring { get; set; } = true;
    public DateTime ValidFrom { get; set; }
    public DateTime? ValidUntil { get; set; }

    public virtual Professor Professor { get; set; } = null!;
    public virtual Student Student { get; set; } = null!;
}
