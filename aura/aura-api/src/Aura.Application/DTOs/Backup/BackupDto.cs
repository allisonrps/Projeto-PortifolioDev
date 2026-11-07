using System;
using System.Collections.Generic;

namespace Aura.Application.DTOs.Backup;

public class BackupDto
{
    public ProfessorBackupDto Professor { get; set; } = null!;
    public List<SubjectBackupDto> Subjects { get; set; } = new();
    public List<StudentBackupDto> Students { get; set; } = new();
    public List<LessonBackupDto> Lessons { get; set; } = new();
    public List<ScheduleBackupDto> Schedules { get; set; } = new();
    public List<HolidayBackupDto> Holidays { get; set; } = new();
    public List<TemplateActivityBackupDto> TemplateActivities { get; set; } = new();
}

public class ProfessorBackupDto
{
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Theme { get; set; } = "dark";
    public string PrimaryColor { get; set; } = "#7C3AED";
    public string SecondaryColor { get; set; } = "#06B6D4";
}

public class SubjectBackupDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<LevelBackupDto> Levels { get; set; } = new();
}

public class LevelBackupDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class StudentBackupDto
{
    public Guid Id { get; set; }
    public Guid SubjectId { get; set; }
    public Guid LevelId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime? BirthDate { get; set; }
    public string? Phone { get; set; }
    public string? Observation { get; set; }
    public string? PhotoUrl { get; set; }
    
    public List<MonthlyPaymentBackupDto> Payments { get; set; } = new();
    public List<ExamBackupDto> Exams { get; set; } = new();
    public List<ExerciseBackupDto> Exercises { get; set; } = new();
    public List<StudentActivityBackupDto> StudentActivities { get; set; } = new();
}

public class MonthlyPaymentBackupDto
{
    public Guid Id { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal Amount { get; set; }
    public bool IsPaid { get; set; }
    public DateTime? PaidAt { get; set; }
}

public class ExamBackupDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime ScheduledAt { get; set; }
    public string? Notes { get; set; }
    public decimal? Grade { get; set; }
    public decimal MaxGrade { get; set; }
}

public class ExerciseBackupDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime ScheduledAt { get; set; }
    public string? Notes { get; set; }
    public decimal? Grade { get; set; }
    public decimal MaxGrade { get; set; }
}

public class StudentActivityBackupDto
{
    public Guid Id { get; set; }
    public Guid TemplateActivityId { get; set; }
    public DateTime ScheduledAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public decimal? Grade { get; set; }
    public decimal MaxGrade { get; set; }
    public string Status { get; set; } = "pending";
    public List<StudentAnswerBackupDto> Answers { get; set; } = new();
}

public class StudentAnswerBackupDto
{
    public Guid Id { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string QuestionType { get; set; } = "multiple_choice";
    public string? OptionA { get; set; }
    public string? OptionB { get; set; }
    public string? OptionC { get; set; }
    public string? OptionD { get; set; }
    public char? CorrectOption { get; set; }
    public char? SelectedOption { get; set; }
    public string? WrittenAnswer { get; set; }
    public string? EvaluationMention { get; set; }
    public decimal? EvaluationScore { get; set; }
    public decimal Weight { get; set; }
    public string? EvaluationNotes { get; set; }
}

public class LessonBackupDto
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public string? Title { get; set; }
    public DateTime ScheduledAt { get; set; }
    public int DurationMinutes { get; set; }
    public string Status { get; set; } = "scheduled";
    public string? Notes { get; set; }
}

public class ScheduleBackupDto
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public int DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public bool IsRecurring { get; set; }
    public DateTime ValidFrom { get; set; }
    public DateTime? ValidUntil { get; set; }
}

public class HolidayBackupDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime? Date { get; set; }
    public bool IsVacationPeriod { get; set; }
    public DateTime? VacationStart { get; set; }
    public DateTime? VacationEnd { get; set; }
}

public class TemplateActivityBackupDto
{
    public Guid Id { get; set; }
    public Guid SubjectId { get; set; }
    public Guid LevelId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = "exercise";
    public decimal MaxGrade { get; set; }
    public List<TemplateQuestionBackupDto> Questions { get; set; } = new();
}

public class TemplateQuestionBackupDto
{
    public Guid Id { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string QuestionType { get; set; } = "multiple_choice";
    public string? OptionA { get; set; }
    public string? OptionB { get; set; }
    public string? OptionC { get; set; }
    public string? OptionD { get; set; }
    public char? CorrectOption { get; set; }
    public decimal Weight { get; set; }
}
