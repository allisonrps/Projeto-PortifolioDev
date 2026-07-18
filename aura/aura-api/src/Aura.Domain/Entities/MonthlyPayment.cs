namespace Aura.Domain.Entities;

public class MonthlyPayment : BaseEntity
{
    public Guid StudentId { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal Amount { get; set; }
    public bool IsPaid { get; set; } = false;
    public DateTime? PaidAt { get; set; }

    public virtual Student Student { get; set; } = null!;
}
