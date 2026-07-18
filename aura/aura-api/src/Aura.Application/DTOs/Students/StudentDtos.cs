namespace Aura.Application.DTOs.Students;

public class CreateStudentDto
{
    public string Name { get; set; } = string.Empty;
    public DateTime? BirthDate { get; set; }
    public string? Phone { get; set; }
    public Guid SubjectId { get; set; }
    public Guid LevelId { get; set; }
    public string? Observation { get; set; }
    public decimal MonthlyPrice { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastClassDate { get; set; }
}

public class UpdateStudentDto
{
    public string? Name { get; set; }
    public DateTime? BirthDate { get; set; }
    public string? Phone { get; set; }
    public Guid? SubjectId { get; set; }
    public Guid? LevelId { get; set; }
    public string? Observation { get; set; }
    public decimal? MonthlyPrice { get; set; }
    public bool? IsActive { get; set; }
    public DateTime? LastClassDate { get; set; }
}

public class StudentResponseDto
{
    public Guid Id { get; set; }
    public Guid ProfessorId { get; set; }
    public Guid SubjectId { get; set; }
    public Guid LevelId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime? BirthDate { get; set; }
    public string? Phone { get; set; }
    public string? Observation { get; set; }
    public string? PhotoUrl { get; set; }
    public string? SubjectName { get; set; }
    public string? LevelName { get; set; }
    public decimal MonthlyPrice { get; set; }
    public bool IsActive { get; set; }
    public DateTime? LastClassDate { get; set; }
    public int AttendanceRate { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class StudentDetailDto : StudentResponseDto
{
    public List<LessonResponseDto> Lessons { get; set; } = new();
    public List<PaymentResponseDto> Payments { get; set; } = new();
    public List<ExamResponseDto> Exams { get; set; } = new();
    public List<ExerciseResponseDto> Exercises { get; set; } = new();
}
