namespace Aura.Application.DTOs.Students;

public class PaymentResponseDto
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal Amount { get; set; }
    public bool IsPaid { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? StudentName { get; set; }
}

public class CreatePaymentDto
{
    public Guid StudentId { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal Amount { get; set; }
    public bool IsPaid { get; set; } = true;
    public DateTime? PaidAt { get; set; }
}

public class UpdatePaymentDto
{
    public bool? IsPaid { get; set; }
    public decimal? Amount { get; set; }
    public DateTime? PaidAt { get; set; }
}

public class ExamResponseDto
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime ScheduledAt { get; set; }
    public string? Notes { get; set; }
    public decimal? Grade { get; set; }
    public decimal MaxGrade { get; set; }
    public string? StudentName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateExamDto
{
    public Guid StudentId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime ScheduledAt { get; set; }
    public string? Notes { get; set; }
    public decimal? Grade { get; set; }
    public decimal MaxGrade { get; set; } = 10m;
}

public class UpdateExamDto
{
    public string? Title { get; set; }
    public DateTime? ScheduledAt { get; set; }
    public string? Notes { get; set; }
    public decimal? Grade { get; set; }
    public decimal? MaxGrade { get; set; }
}

public class ExerciseResponseDto
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime ScheduledAt { get; set; }
    public string? Notes { get; set; }
    public decimal? Grade { get; set; }
    public decimal MaxGrade { get; set; }
    public string? StudentName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateExerciseDto
{
    public Guid StudentId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime ScheduledAt { get; set; }
    public string? Notes { get; set; }
    public decimal? Grade { get; set; }
    public decimal MaxGrade { get; set; } = 10m;
}

public class UpdateExerciseDto
{
    public string? Title { get; set; }
    public DateTime? ScheduledAt { get; set; }
    public string? Notes { get; set; }
    public decimal? Grade { get; set; }
    public decimal? MaxGrade { get; set; }
}
