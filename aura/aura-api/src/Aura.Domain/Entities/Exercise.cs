namespace Aura.Domain.Entities;

public class Exercise : BaseEntity
{
    public Guid StudentId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime ScheduledAt { get; set; }
    public string? Notes { get; set; }
    public decimal? Grade { get; set; }
    public decimal MaxGrade { get; set; } = 10;

    public virtual Student Student { get; set; } = null!;
}
