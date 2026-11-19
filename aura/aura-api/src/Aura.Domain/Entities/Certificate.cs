namespace Aura.Domain.Entities;

public class Certificate : BaseEntity
{
    public Guid ProfessorId { get; set; }
    public Guid StudentId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string? FileType { get; set; } // "image" or "pdf"
    public string? FileName { get; set; }
    public DateTime IssueDate { get; set; } = DateTime.UtcNow;

    public virtual Professor Professor { get; set; } = null!;
    public virtual Student Student { get; set; } = null!;
}
