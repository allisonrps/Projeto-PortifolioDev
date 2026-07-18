namespace Aura.Domain.Entities;

public class Subscription : BaseEntity
{
    public Guid ProfessorId { get; set; }
    public string PlanType { get; set; } = "free";
    public decimal Price { get; set; }
    public string Status { get; set; } = "active";
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? PaymentGatewayId { get; set; }

    public virtual Professor Professor { get; set; } = null!;
}
