namespace Aura.Domain.Entities;

public class StudentAnswer : BaseEntity
{
    public Guid StudentActivityId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string QuestionType { get; set; } = "multiple_choice"; // "multiple_choice", "writing"
    public string? OptionA { get; set; }
    public string? OptionB { get; set; }
    public string? OptionC { get; set; }
    public string? OptionD { get; set; }
    public char? CorrectOption { get; set; }
    public char? SelectedOption { get; set; } // 'A', 'B', 'C', 'D'
    public string? WrittenAnswer { get; set; }
    public string? EvaluationMention { get; set; } // "Ruim" | "Médio" | "Bom" | "Excelente"
    public decimal? EvaluationScore { get; set; } // 0.25 | 0.50 | 0.75 | 1.00
    public decimal Weight { get; set; } = 1.0m;
    public string? EvaluationNotes { get; set; }

    public virtual StudentActivity StudentActivity { get; set; } = null!;
}
