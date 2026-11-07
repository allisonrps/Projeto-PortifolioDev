namespace Aura.Domain.Entities;

public class TemplateQuestion : BaseEntity
{
    public Guid TemplateActivityId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string QuestionType { get; set; } = "multiple_choice"; // "multiple_choice", "writing"
    public string? OptionA { get; set; }
    public string? OptionB { get; set; }
    public string? OptionC { get; set; }
    public string? OptionD { get; set; }
    public char? CorrectOption { get; set; } // 'A', 'B', 'C', 'D'
    public decimal Weight { get; set; } = 1.0m;

    public virtual TemplateActivity TemplateActivity { get; set; } = null!;
}
