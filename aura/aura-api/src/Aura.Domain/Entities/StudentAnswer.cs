namespace Aura.Domain.Entities;

public class StudentAnswer : BaseEntity
{
    public Guid StudentActivityId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string OptionA { get; set; } = string.Empty;
    public string OptionB { get; set; } = string.Empty;
    public string OptionC { get; set; } = string.Empty;
    public string OptionD { get; set; } = string.Empty;
    public char CorrectOption { get; set; }
    public char? SelectedOption { get; set; } // 'A', 'B', 'C', 'D'

    public virtual StudentActivity StudentActivity { get; set; } = null!;
}
