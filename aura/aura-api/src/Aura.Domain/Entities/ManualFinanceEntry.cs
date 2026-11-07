namespace Aura.Domain.Entities;

public class ManualFinanceEntry : BaseEntity
{
    public Guid ProfessorId { get; set; }
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
    public string Description { get; set; } = string.Empty;

    public virtual Professor Professor { get; set; } = null!;
}
