namespace Aura.Domain.Entities;

public class Level : BaseEntity
{
    public Guid SubjectId { get; set; }
    public string Name { get; set; } = string.Empty;

    public virtual Subject Subject { get; set; } = null!;
    public virtual ICollection<Student> Students { get; set; } = new List<Student>();
}
