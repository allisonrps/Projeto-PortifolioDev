namespace Aura.Domain.Entities;

public class TemplateQuestion : BaseEntity
{
    public Guid TemplateActivityId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string OptionA { get; set; } = string.Empty;
    public string OptionB { get; set; } = string.Empty;
    public string OptionC { get; set; } = string.Empty;
    public string OptionD { get; set; } = string.Empty;
    public char CorrectOption { get; set; } // 'A', 'B', 'C', 'D'

    public virtual TemplateActivity TemplateActivity { get; set; } = null!;
}
