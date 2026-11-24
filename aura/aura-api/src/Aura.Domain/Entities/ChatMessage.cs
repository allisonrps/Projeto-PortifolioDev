namespace Aura.Domain.Entities;

public enum MessageSenderType
{
    Student = 1,
    Professor = 2
}

public class ChatMessage : BaseEntity
{
    public Guid StudentId { get; set; }
    public Guid ProfessorId { get; set; }
    public MessageSenderType SenderType { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsReadByProfessor { get; set; } = false;
    public bool IsReadByStudent { get; set; } = false;

    public virtual Student Student { get; set; } = null!;
    public virtual Professor Professor { get; set; } = null!;
}
