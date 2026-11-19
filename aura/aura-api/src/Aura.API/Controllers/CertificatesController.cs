using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Aura.Domain.Entities;
using Aura.Infrastructure.Data;
using Aura.Application.Services;
using Aura.Application.DTOs.Certificates;

namespace Aura.API.Controllers;

[Route("api")]
public class CertificatesController : BaseApiController
{
    private readonly AuraDbContext _context;
    private readonly IFileStorageService _fileStorage;
    private const long MaxFileSizeBytes = 20 * 1024 * 1024; // 20 MB

    public CertificatesController(AuraDbContext context, IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    [HttpGet("students/{studentId}/certificates")]
    public async Task<ActionResult> GetByStudent(Guid studentId)
    {
        var professorId = GetProfessorId();
        var student = await _context.Students
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == studentId && s.ProfessorId == professorId && !s.IsDeleted);

        if (student == null)
            return NotFound("Aluno não encontrado ou acesso não autorizado.");

        var certs = await _context.Certificates
            .AsNoTracking()
            .Where(c => c.StudentId == studentId && c.ProfessorId == professorId && !c.IsDeleted)
            .OrderByDescending(c => c.IssueDate)
            .Select(c => new CertificateDto
            {
                Id = c.Id,
                StudentId = c.StudentId,
                StudentName = student.Name,
                Title = c.Title,
                Description = c.Description,
                FileUrl = c.FileUrl,
                FileType = c.FileType ?? (c.FileUrl.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase) ? "pdf" : "image"),
                FileName = c.FileName,
                IssueDate = c.IssueDate,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();

        return Ok(certs);
    }

    [HttpPost("students/{studentId}/certificates")]
    [RequestSizeLimit(MaxFileSizeBytes)]
    public async Task<ActionResult> Create(
        Guid studentId,
        [FromForm] string title,
        [FromForm] string? description,
        [FromForm] DateTime? issueDate,
        IFormFile? file)
    {
        var professorId = GetProfessorId();
        var student = await _context.Students
            .FirstOrDefaultAsync(s => s.Id == studentId && s.ProfessorId == professorId && !s.IsDeleted);

        if (student == null)
            return NotFound("Aluno não encontrado ou acesso não autorizado.");

        if (string.IsNullOrWhiteSpace(title))
            return BadRequest("O título do certificado é obrigatório.");

        if (file == null || file.Length == 0)
            return BadRequest("É obrigatório enviar uma imagem ou documento PDF do certificado.");

        if (file.Length > MaxFileSizeBytes)
            return BadRequest("O arquivo enviado ultrapassa o limite máximo de 20 MB.");

        var rawExt = Path.GetExtension(file.FileName)?.ToLowerInvariant() ?? string.Empty;
        var fileType = rawExt.Equals(".pdf", StringComparison.OrdinalIgnoreCase) ? "pdf" : "image";

        string savedUrl;
        using (var stream = file.OpenReadStream())
        {
            savedUrl = await _fileStorage.SaveFileAsync(stream, file.FileName, "certificates");
        }

        var certificate = new Certificate
        {
            ProfessorId = professorId,
            StudentId = studentId,
            Title = title.Trim(),
            Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim(),
            FileUrl = savedUrl,
            FileType = fileType,
            FileName = file.FileName,
            IssueDate = issueDate ?? DateTime.UtcNow
        };

        _context.Certificates.Add(certificate);
        await _context.SaveChangesAsync();

        var dto = new CertificateDto
        {
            Id = certificate.Id,
            StudentId = certificate.StudentId,
            StudentName = student.Name,
            Title = certificate.Title,
            Description = certificate.Description,
            FileUrl = certificate.FileUrl,
            FileType = certificate.FileType,
            FileName = certificate.FileName,
            IssueDate = certificate.IssueDate,
            CreatedAt = certificate.CreatedAt
        };

        return Created($"/api/certificates/{certificate.Id}", dto);
    }

    [HttpDelete("certificates/{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var professorId = GetProfessorId();
        var cert = await _context.Certificates
            .FirstOrDefaultAsync(c => c.Id == id && c.ProfessorId == professorId && !c.IsDeleted);

        if (cert == null)
            return NotFound("Certificado não encontrado ou acesso não autorizado.");

        cert.IsDeleted = true;
        await _context.SaveChangesAsync();

        // Limpeza física do arquivo
        try
        {
            _fileStorage.DeleteFile(cert.FileUrl);
        }
        catch
        {
            // Ignora falha na exclusão de arquivo físico
        }

        return NoContent();
    }
}
