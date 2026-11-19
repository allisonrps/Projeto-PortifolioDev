using System;

namespace Aura.Application.DTOs.Certificates;

public class CertificateDto
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string? FileType { get; set; } // "image" or "pdf"
    public string? FileName { get; set; }
    public DateTime IssueDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateCertificateRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? IssueDate { get; set; }
    public string? ImageBase64 { get; set; }
    public string? FileName { get; set; }
}
