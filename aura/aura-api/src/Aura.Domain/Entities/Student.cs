namespace Aura.Domain.Entities;

public class Student : BaseEntity
{
    public Guid ProfessorId { get; set; }
    public Guid SubjectId { get; set; }
    public Guid LevelId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime? BirthDate { get; set; }
    public string? Phone { get; set; }
    public string? Observation { get; set; }
    public string? PhotoUrl { get; set; }
    public string? GuardianName { get; set; }
    public string? GuardianPhone { get; set; }
    public decimal MonthlyPrice { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public DateTime? FirstClassDate { get; set; }
    public DateTime? LastClassDate { get; set; }

    public virtual Professor Professor { get; set; } = null!;
    public virtual Subject Subject { get; set; } = null!;
    public virtual Level Level { get; set; } = null!;
    public virtual ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
    public virtual ICollection<MonthlyPayment> MonthlyPayments { get; set; } = new List<MonthlyPayment>();
    public virtual ICollection<Exam> Exams { get; set; } = new List<Exam>();
    public virtual ICollection<Exercise> Exercises { get; set; } = new List<Exercise>();
}
