namespace Aura.Domain.Entities;

public class StudentActivity : BaseEntity
{
    public Guid StudentId { get; set; }
    public Guid TemplateActivityId { get; set; }
    public DateTime ScheduledAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public decimal? Grade { get; set; }
    public decimal MaxGrade { get; set; } = 10;
    public string Status { get; set; } = "pending"; // "pending" or "completed"

    public virtual Student Student { get; set; } = null!;
    public virtual TemplateActivity TemplateActivity { get; set; } = null!;
    public virtual ICollection<StudentAnswer> Answers { get; set; } = new List<StudentAnswer>();
}
