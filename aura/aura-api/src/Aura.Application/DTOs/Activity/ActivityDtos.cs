using System.ComponentModel.DataAnnotations;

namespace Aura.Application.DTOs.Activity;

public class CreateTemplateDto
{
    [Required(ErrorMessage = "O título é obrigatório.")]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public Guid SubjectId { get; set; }

    [Required]
    public Guid LevelId { get; set; }

    [Required]
    public string Type { get; set; } = "exercise"; // "exam" or "exercise"

    [Required]
    [MinLength(1, ErrorMessage = "A atividade deve ter pelo menos 1 questão.")]
    public List<CreateQuestionDto> Questions { get; set; } = new();
}

public class CreateQuestionDto
{
    [Required(ErrorMessage = "O texto da pergunta é obrigatório.")]
    public string QuestionText { get; set; } = string.Empty;

    [Required(ErrorMessage = "A opção A é obrigatória.")]
    public string OptionA { get; set; } = string.Empty;

    [Required(ErrorMessage = "A opção B é obrigatória.")]
    public string OptionB { get; set; } = string.Empty;

    [Required(ErrorMessage = "A opção C é obrigatória.")]
    public string OptionC { get; set; } = string.Empty;

    [Required(ErrorMessage = "A opção D é obrigatória.")]
    public string OptionD { get; set; } = string.Empty;

    [Required]
    public char CorrectOption { get; set; } // 'A', 'B', 'C', 'D'
}

public class TemplateResponseDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public Guid SubjectId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public Guid LevelId { get; set; }
    public string LevelName { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<QuestionResponseDto> Questions { get; set; } = new();
}

public class QuestionResponseDto
{
    public Guid Id { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string OptionA { get; set; } = string.Empty;
    public string OptionB { get; set; } = string.Empty;
    public string OptionC { get; set; } = string.Empty;
    public string OptionD { get; set; } = string.Empty;
    public char CorrectOption { get; set; }
}

public class AssignActivityDto
{
    [Required]
    public Guid StudentId { get; set; }

    [Required]
    public Guid TemplateActivityId { get; set; }
}

public class StudentActivityResponseDto
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public Guid TemplateActivityId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public DateTime ScheduledAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public decimal? Grade { get; set; }
    public decimal MaxGrade { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<StudentAnswerResponseDto> Answers { get; set; } = new();
}

public class StudentAnswerResponseDto
{
    public Guid Id { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string OptionA { get; set; } = string.Empty;
    public string OptionB { get; set; } = string.Empty;
    public string OptionC { get; set; } = string.Empty;
    public string OptionD { get; set; } = string.Empty;
    public char CorrectOption { get; set; }
    public char? SelectedOption { get; set; }
}

public class SubmitActivityDto
{
    [Required]
    public List<SubmitAnswerDto> Answers { get; set; } = new();
}

public class SubmitAnswerDto
{
    [Required]
    public Guid QuestionId { get; set; }

    [Required]
    public char SelectedOption { get; set; } // 'A', 'B', 'C', 'D'
}
