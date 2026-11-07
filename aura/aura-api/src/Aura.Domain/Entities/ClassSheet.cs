using System;

namespace Aura.Domain.Entities;

public class ClassSheet : BaseEntity
{
    public Guid LevelId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;

    public virtual Level Level { get; set; } = null!;
}
