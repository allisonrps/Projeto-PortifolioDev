namespace Aura.Domain.Entities;

public class TemplateActivity : BaseEntity
{
    public Guid ProfessorId { get; set; }
    public Guid SubjectId { get; set; }
    public Guid LevelId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = "exercise"; // "exam" or "exercise"

    public virtual Professor Professor { get; set; } = null!;
    public virtual Subject Subject { get; set; } = null!;
    public virtual Level Level { get; set; } = null!;
    public virtual ICollection<TemplateQuestion> Questions { get; set; } = new List<TemplateQuestion>();
}
