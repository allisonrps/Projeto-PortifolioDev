namespace Aura.Domain.Entities;

public class Holiday : BaseEntity
{
    public Guid ProfessorId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime? Date { get; set; }
    public bool IsVacationPeriod { get; set; } = false;
    public DateTime? VacationStart { get; set; }
    public DateTime? VacationEnd { get; set; }

    public virtual Professor Professor { get; set; } = null!;
}
