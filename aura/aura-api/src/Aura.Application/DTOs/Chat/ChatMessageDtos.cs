using System;

namespace Aura.Application.DTOs.Chat;

public class ChatMessageDto
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Guid ProfessorId { get; set; }
    public string SenderType { get; set; } = string.Empty; // "student" or "professor"
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsReadByProfessor { get; set; }
    public bool IsReadByStudent { get; set; }
}

public class SendChatMessageDto
{
    public string Content { get; set; } = string.Empty;
}

public class StudentUnreadSummaryDto
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string? StudentPhotoUrl { get; set; }
    public int UnreadCount { get; set; }
    public string LastMessageContent { get; set; } = string.Empty;
    public DateTime LastMessageDate { get; set; }
}
