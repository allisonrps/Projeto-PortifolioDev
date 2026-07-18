namespace Aura.Domain.Entities;

public class Subject : BaseEntity
{
    public Guid ProfessorId { get; set; }
    public string Name { get; set; } = string.Empty;

    public virtual Professor Professor { get; set; } = null!;
    public virtual ICollection<Level> Levels { get; set; } = new List<Level>();
    public virtual ICollection<Student> Students { get; set; } = new List<Student>();
}
