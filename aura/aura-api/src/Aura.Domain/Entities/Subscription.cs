namespace Aura.Domain.Entities;

public class Subscription : BaseEntity
{
    public Guid ProfessorId { get; set; }
    public string PlanType { get; set; } = "monthly";
    public decimal Price { get; set; }
    public string Status { get; set; } = "pending";
    public string BillingType { get; set; } = "UNDEFINED";
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? PaymentGatewayId { get; set; }
    public string? InvoiceUrl { get; set; }
    public string? PixQrCodeImage { get; set; }
    public string? PixCopyPaste { get; set; }

    public virtual Professor Professor { get; set; } = null!;
}
