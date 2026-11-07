using System;

namespace Aura.Domain.Entities;

public class ClassSheetStudent
{
    public Guid StudentId { get; set; }
    public Guid ClassSheetId { get; set; }

    public virtual Student Student { get; set; } = null!;
    public virtual ClassSheet ClassSheet { get; set; } = null!;
}
