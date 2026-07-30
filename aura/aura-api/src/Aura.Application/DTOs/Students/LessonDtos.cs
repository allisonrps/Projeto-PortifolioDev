namespace Aura.Application.DTOs.Students;

public class LessonResponseDto
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Guid ProfessorId { get; set; }
    public string? Title { get; set; }
    public DateTime ScheduledAt { get; set; }
    public int DurationMinutes { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? StudentName { get; set; }
    public string? SubjectName { get; set; }
    public string? LevelName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateLessonDto
{
    public Guid StudentId { get; set; }
    public string? Title { get; set; }
    public DateTime ScheduledAt { get; set; }
    public int DurationMinutes { get; set; } = 60;
    public string? Notes { get; set; }
}

public class UpdateLessonDto
{
    public string? Title { get; set; }
    public DateTime? ScheduledAt { get; set; }
    public int? DurationMinutes { get; set; }
    public string? Status { get; set; }
    public string? Notes { get; set; }
}
