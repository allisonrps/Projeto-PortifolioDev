using System;

namespace Aura.Application.DTOs.Subjects;

public class ClassSheetResponseDto
{
    public Guid Id { get; set; }
    public Guid LevelId { get; set; }
    public string LevelName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateClassSheetDto
{
    public Guid LevelId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}

public class UpdateClassSheetDto
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}

public class ClassSheetStudentDto
{
    public Guid StudentId { get; set; }
    public Guid ClassSheetId { get; set; }
}
