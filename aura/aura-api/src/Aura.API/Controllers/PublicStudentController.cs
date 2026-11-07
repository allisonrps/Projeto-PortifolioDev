using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Aura.Infrastructure.Data;
using Aura.Application.DTOs.Subjects;
using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using SkiaSharp;

namespace Aura.API.Controllers;

[ApiController]
[Route("api/public/student")]
[AllowAnonymous]
[EnableRateLimiting("public")]
public class PublicStudentController : ControllerBase
{
    private readonly AuraDbContext _context;
    private readonly IMapper _mapper;

    public PublicStudentController(AuraDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    [HttpGet("{studentId}")]
    public async Task<ActionResult> GetProfile(Guid studentId)
    {
        var student = await _context.Students
            .Include(s => s.Subject)
            .Include(s => s.Level)
            .FirstOrDefaultAsync(s => s.Id == studentId && !s.IsDeleted);

        if (student == null)
            return NotFound("Aluno não encontrado.");

        return Ok(new
        {
            student.Id,
            student.Name,
            student.PhotoUrl,
            SubjectName = student.Subject.Name,
            LevelName = student.Level.Name
        });
    }

    [HttpGet("{studentId}/exams-exercises")]
    public async Task<ActionResult> GetExamsAndExercises(Guid studentId)
    {
        var exams = await _context.Exams
            .Where(e => e.StudentId == studentId && !e.IsDeleted)
            .OrderByDescending(e => e.ScheduledAt)
            .Select(e => new {
                e.Id,
                e.Title,
                e.ScheduledAt,
                e.Grade,
                e.MaxGrade,
                e.Notes,
                Type = "exam",
                IsOnline = false,
                Status = "completed"
            })
            .ToListAsync();

        var exercises = await _context.Exercises
            .Where(e => e.StudentId == studentId && !e.IsDeleted)
            .OrderByDescending(e => e.ScheduledAt)
            .Select(e => new {
                e.Id,
                e.Title,
                e.ScheduledAt,
                e.Grade,
                e.MaxGrade,
                e.Notes,
                Type = "exercise",
                IsOnline = false,
                Status = "completed"
            })
            .ToListAsync();

        var onlineActivities = await _context.StudentActivities
            .Include(sa => sa.TemplateActivity)
            .Where(sa => sa.StudentId == studentId && !sa.IsDeleted)
            .OrderByDescending(sa => sa.ScheduledAt)
            .Select(sa => new {
                sa.Id,
                Title = sa.TemplateActivity.Title,
                sa.ScheduledAt,
                sa.Grade,
                sa.MaxGrade,
                Notes = sa.Status == "completed" ? "Atividade concluída online" : 
                        sa.Status == "corrigir" ? "Concluída online. Aguardando correção do professor." : 
                        "Pendente de realização",
                Type = sa.TemplateActivity.Type,
                IsOnline = true,
                sa.Status
            })
            .ToListAsync();

        var combined = exams.Select(e => (object)e)
            .Concat(exercises.Select(ex => (object)ex))
            .Concat(onlineActivities.Select(oa => (object)oa))
            .OrderByDescending(o => ((dynamic)o).ScheduledAt)
            .ToList();

        return Ok(combined);
    }

    [HttpGet("{studentId}/class-sheets")]
    public async Task<ActionResult> GetClassSheets(Guid studentId)
    {
        var sheets = await _context.ClassSheetStudents
            .Include(cs => cs.ClassSheet)
                .ThenInclude(c => c.Level)
            .Where(cs => cs.StudentId == studentId && !cs.ClassSheet.IsDeleted)
            .Select(cs => cs.ClassSheet)
            .ToListAsync();

        return Ok(_mapper.Map<IEnumerable<ClassSheetResponseDto>>(sheets));
    }

    [HttpGet("class-sheets/{id}")]
    public async Task<ActionResult> GetClassSheetDetail(Guid id)
    {
        var sheet = await _context.ClassSheets
            .FirstOrDefaultAsync(cs => cs.Id == id && !cs.IsDeleted);

        if (sheet == null)
            return NotFound("Ficha pedagógica não encontrada.");

        return Ok(_mapper.Map<ClassSheetResponseDto>(sheet));
    }

    public class UploadPhotoRequest
    {
        public string ImageBase64 { get; set; } = string.Empty;
    }

    [HttpPost("{studentId}/photo")]
    [RequestSizeLimit(5 * 1024 * 1024)] // Máximo 5MB
    public async Task<ActionResult> UploadPhoto(Guid studentId, [FromBody] UploadPhotoRequest request)
    {
        if (string.IsNullOrWhiteSpace(request?.ImageBase64))
            return BadRequest("A imagem base64 não foi enviada.");

        var student = await _context.Students.FirstOrDefaultAsync(s => s.Id == studentId && !s.IsDeleted);
        if (student == null)
            return NotFound("Aluno não encontrado.");

        try
        {
            // Remover prefixo data:image/...;base64, caso venha do frontend
            var base64Data = request.ImageBase64;
            var commaIndex = base64Data.IndexOf(',');
            if (commaIndex >= 0)
            {
                base64Data = base64Data.Substring(commaIndex + 1);
            }

            var imageBytes = Convert.FromBase64String(base64Data);
            if (imageBytes.Length == 0 || imageBytes.Length > 5 * 1024 * 1024)
                return BadRequest("Tamanho de arquivo de imagem inválido.");

            // Sanitização com SkiaSharp: carrega a imagem real decodificando pixels, redimensiona para 400x400 e re-encoda em WebP
            using var inputStream = new MemoryStream(imageBytes);
            using var originalBitmap = SKBitmap.Decode(inputStream);
            if (originalBitmap == null)
                return BadRequest("Não foi possível decodificar o arquivo de imagem.");

            // Redimensionamento de alta qualidade em 400x400
            int targetWidth = 400;
            int targetHeight = 400;
            using var resizedBitmap = originalBitmap.Resize(new SKImageInfo(targetWidth, targetHeight), new SKSamplingOptions(SKFilterMode.Linear, SKMipmapMode.Linear));
            if (resizedBitmap == null)
                return BadRequest("Falha ao processar o redimensionamento da imagem.");

            using var image = SKImage.FromBitmap(resizedBitmap);
            using var webpData = image.Encode(SKEncodedImageFormat.Webp, 82);
            if (webpData == null)
                return BadRequest("Falha ao codificar a imagem em formato WebP.");

            // Diretório público servido pelo app.UseStaticFiles()
            var webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var avatarsFolder = Path.Combine(webRoot, "uploads", "avatars");
            if (!Directory.Exists(avatarsFolder))
            {
                Directory.CreateDirectory(avatarsFolder);
            }

            // Arquivo determinístico por aluno: {studentId}.webp
            // Qualquer upload substitui o anterior imediatamente, nunca acumulando arquivos
            var fileName = $"{student.Id}.webp";
            var filePath = Path.Combine(avatarsFolder, fileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write))
            {
                webpData.SaveTo(fileStream);
            }

            // Versão com timestamp para contornar cache imediato no frontend
            var photoUrl = $"/uploads/avatars/{fileName}?t={DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
            student.PhotoUrl = photoUrl;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Foto do perfil atualizada com sucesso!",
                photoUrl
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Arquivo de imagem inválido ou não suportado: {ex.Message}");
        }
    }
}
