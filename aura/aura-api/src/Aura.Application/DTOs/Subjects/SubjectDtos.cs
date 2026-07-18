namespace Aura.Application.DTOs.Subjects;

public class CreateSubjectDto
{
    public string Name { get; set; } = string.Empty;
}

public class UpdateSubjectDto
{
    public string Name { get; set; } = string.Empty;
}

public class SubjectResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int StudentCount { get; set; }
    public List<LevelResponseDto> Levels { get; set; } = new();
}

public class CreateLevelDto
{
    public Guid SubjectId { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class UpdateLevelDto
{
    public string Name { get; set; } = string.Empty;
}

public class LevelResponseDto
{
    public Guid Id { get; set; }
    public Guid SubjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int StudentCount { get; set; }
}
