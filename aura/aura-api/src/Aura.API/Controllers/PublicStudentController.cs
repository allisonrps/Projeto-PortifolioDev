using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Aura.Infrastructure.Data;
using Aura.Application.DTOs.Subjects;
using Aura.Application.DTOs.Chat;
using Aura.Domain.Entities;
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
    private readonly IWebHostEnvironment _env;

    public PublicStudentController(AuraDbContext context, IMapper mapper, IWebHostEnvironment env)
    {
        _context = context;
        _mapper = mapper;
        _env = env;
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
            PhotoUrl = student.PhotoUrl,
            SubjectName = student.Subject.Name,
            LevelName = student.Level.Name,
            student.CreatedAt,
            student.FirstClassDate,
            student.IsActive
        });
    }

    [HttpGet("{studentId}/avatar")]
    [ResponseCache(Duration = 3600, Location = ResponseCacheLocation.Any)]
    public async Task<IActionResult> GetAvatar(Guid studentId)
    {
        var student = await _context.Students.AsNoTracking().FirstOrDefaultAsync(s => s.Id == studentId && !s.IsDeleted);
        if (student == null || string.IsNullOrEmpty(student.PhotoUrl))
            return NotFound("Foto não encontrada.");

        // Se for Data URI armazenada permanentemente no banco:
        if (student.PhotoUrl.StartsWith("data:image/"))
        {
            var commaIndex = student.PhotoUrl.IndexOf(',');
            if (commaIndex >= 0)
            {
                var base64 = student.PhotoUrl.Substring(commaIndex + 1);
                var bytes = Convert.FromBase64String(base64);
                var mime = student.PhotoUrl.Contains("image/png") ? "image/png" 
                         : student.PhotoUrl.Contains("image/webp") ? "image/webp" 
                         : "image/jpeg";
                return File(bytes, mime);
            }
        }

        // Fallback: se for arquivo físico em cache local
        var contentRoot = _env.ContentRootPath;
        var avatarsFolder = Path.Combine(contentRoot, "wwwroot", "uploads", "avatars");

        var jpgPath = Path.Combine(avatarsFolder, $"{studentId}.jpg");
        if (System.IO.File.Exists(jpgPath))
            return PhysicalFile(jpgPath, "image/jpeg");

        var webpPath = Path.Combine(avatarsFolder, $"{studentId}.webp");
        if (System.IO.File.Exists(webpPath))
            return PhysicalFile(webpPath, "image/webp");

        var pngPath = Path.Combine(avatarsFolder, $"{studentId}.png");
        if (System.IO.File.Exists(pngPath))
            return PhysicalFile(pngPath, "image/png");

        if (student.PhotoUrl.Contains("/uploads/"))
        {
            var relativePath = student.PhotoUrl.Split('?')[0].TrimStart('/');
            var fullPath = Path.Combine(contentRoot, "wwwroot", relativePath);
            if (System.IO.File.Exists(fullPath))
            {
                var ext = Path.GetExtension(fullPath).ToLowerInvariant();
                var contentType = ext == ".png" ? "image/png" : ext == ".webp" ? "image/webp" : "image/jpeg";
                return PhysicalFile(fullPath, contentType);
            }
        }

        return NotFound("Foto não encontrada.");
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
            .AsNoTracking()
            .Include(cs => cs.ClassSheet)
                .ThenInclude(c => c.Level)
            .Where(cs => cs.StudentId == studentId && !cs.ClassSheet.IsDeleted)
            .OrderBy(cs => cs.ClassSheet.Title)
            .Select(cs => new ClassSheetResponseDto
            {
                Id = cs.ClassSheet.Id,
                LevelId = cs.ClassSheet.LevelId,
                LevelName = cs.ClassSheet.Level != null ? cs.ClassSheet.Level.Name : string.Empty,
                Title = cs.ClassSheet.Title,
                Content = string.Empty, // Otimização crítica: não carrega megabytes de HTML/imagens na listagem
                CreatedAt = cs.ClassSheet.CreatedAt,
                UpdatedAt = cs.ClassSheet.UpdatedAt ?? cs.ClassSheet.CreatedAt
            })
            .ToListAsync();

        return Ok(sheets);
    }

    [HttpGet("class-sheets/{id}")]
    public async Task<ActionResult> GetClassSheetDetail(Guid id)
    {
        var sheet = await _context.ClassSheets
            .AsNoTracking()
            .Include(cs => cs.Level)
            .FirstOrDefaultAsync(cs => cs.Id == id && !cs.IsDeleted);

        if (sheet == null)
            return NotFound("Ficha pedagógica não encontrada.");

        var dto = _mapper.Map<ClassSheetResponseDto>(sheet);
        if (sheet.Level != null)
        {
            dto.LevelName = sheet.Level.Name;
        }

        return Ok(dto);
    }

    [HttpGet("{studentId}/certificates")]
    public async Task<ActionResult> GetCertificates(Guid studentId)
    {
        var certs = await _context.Certificates
            .AsNoTracking()
            .Where(c => c.StudentId == studentId && !c.IsDeleted)
            .OrderByDescending(c => c.IssueDate)
            .Select(c => new
            {
                c.Id,
                c.Title,
                c.Description,
                c.FileUrl,
                FileType = c.FileType ?? (c.FileUrl.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase) ? "pdf" : "image"),
                c.FileName,
                c.IssueDate,
                c.CreatedAt
            })
            .ToListAsync();

        return Ok(certs);
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
            var base64Data = request.ImageBase64.Trim();
            var commaIndex = base64Data.IndexOf(',');
            if (commaIndex >= 0)
            {
                base64Data = base64Data.Substring(commaIndex + 1);
            }

            // Normalizar espaços e quebras de linha para evitar erro de Base64
            base64Data = base64Data.Replace(" ", "+").Replace("\r", "").Replace("\n", "");

            var imageBytes = Convert.FromBase64String(base64Data);
            if (imageBytes.Length == 0 || imageBytes.Length > 15 * 1024 * 1024)
                return BadRequest("Tamanho de arquivo de imagem inválido.");

            // Validação binária pura (Magic Bytes) sem depender de bibliotecas nativas C++
            string ext = "jpg";
            if (imageBytes.Length >= 3 && imageBytes[0] == 0xFF && imageBytes[1] == 0xD8 && imageBytes[2] == 0xFF)
            {
                ext = "jpg";
            }
            else if (imageBytes.Length >= 8 && imageBytes[0] == 0x89 && imageBytes[1] == 0x50 && imageBytes[2] == 0x4E && imageBytes[3] == 0x47)
            {
                ext = "png";
            }
            else if (imageBytes.Length >= 12 && imageBytes[0] == 0x52 && imageBytes[1] == 0x49 && imageBytes[2] == 0x46 && imageBytes[3] == 0x46 
                     && imageBytes[8] == 0x57 && imageBytes[9] == 0x45 && imageBytes[10] == 0x42 && imageBytes[11] == 0x50)
            {
                ext = "webp";
            }
            else
            {
                return BadRequest("Formato de imagem inválido. O arquivo enviado deve ser JPEG, PNG ou WebP.");
            }

            byte[] finalBytes = imageBytes;

            // Tentativa resiliente de processamento adicional com SkiaSharp.
            // Se o ambiente do servidor não suportar SkiaSharp nativo (ex: TypeInitializationException em Linux minimal),
            // o fallback entra em ação silenciosamente salvando os bytes sanitizados da imagem já formatada em 400x400 pelo Canvas.
            try
            {
                using var data = SKData.CreateCopy(imageBytes);
                using var originalBitmap = SKBitmap.Decode(data);
                if (originalBitmap != null)
                {
                    int targetWidth = 400;
                    int targetHeight = 400;
                    using var resizedBitmap = originalBitmap.Resize(new SKImageInfo(targetWidth, targetHeight), new SKSamplingOptions(SKFilterMode.Linear, SKMipmapMode.Linear));
                    if (resizedBitmap != null)
                    {
                        using var image = SKImage.FromBitmap(resizedBitmap);
                        using var encoded = image.Encode(SKEncodedImageFormat.Jpeg, 88) 
                                         ?? image.Encode(SKEncodedImageFormat.Png, 100);
                        if (encoded != null)
                        {
                            finalBytes = encoded.ToArray();
                            ext = "jpg";
                        }
                    }
                }
            }
            catch
            {
                // Fallback silencioso para garantir que o upload nunca falhe no Linux
            }

            // Salva no disco local como cache estático
            try
            {
                var contentRoot = _env.ContentRootPath;
                var avatarsFolder = Path.Combine(contentRoot, "wwwroot", "uploads", "avatars");
                if (!Directory.Exists(avatarsFolder))
                {
                    Directory.CreateDirectory(avatarsFolder);
                }

                var fileName = $"{student.Id}.{ext}";
                var filePath = Path.Combine(avatarsFolder, fileName);

                var oldWebp = Path.Combine(avatarsFolder, $"{student.Id}.webp");
                var oldJpg = Path.Combine(avatarsFolder, $"{student.Id}.jpg");
                var oldPng = Path.Combine(avatarsFolder, $"{student.Id}.png");
                if (ext != "webp" && System.IO.File.Exists(oldWebp)) System.IO.File.Delete(oldWebp);
                if (ext != "jpg" && System.IO.File.Exists(oldJpg)) System.IO.File.Delete(oldJpg);
                if (ext != "png" && System.IO.File.Exists(oldPng)) System.IO.File.Delete(oldPng);

                await System.IO.File.WriteAllBytesAsync(filePath, finalBytes);
            }
            catch
            {
                // Cache em disco é opcional; o banco de dados é a fonte permanente da verdade
            }

            // PERSISTÊNCIA PERMANENTE NO BANCO DE DADOS:
            // Salva como Data URI diretamente na coluna PhotoUrl da tabela Students.
            // O PostgreSQL preserva os dados para sempre, imune a reinicializações de contêineres,
            // servidores efêmeros do Render/Railway ou novos deploys de código.
            string mimeType = ext == "png" ? "image/png" : ext == "webp" ? "image/webp" : "image/jpeg";
            var persistentDataUrl = $"data:{mimeType};base64,{Convert.ToBase64String(finalBytes)}";
            student.PhotoUrl = persistentDataUrl;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Foto do perfil atualizada com sucesso!",
                photoUrl = persistentDataUrl
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Arquivo de imagem inválido ou não suportado: {ex.Message}");
        }
    }

    [HttpGet("{studentId}/messages")]
    public async Task<ActionResult<List<ChatMessageDto>>> GetStudentMessages(Guid studentId)
    {
        var student = await _context.Students
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == studentId && !s.IsDeleted);

        if (student == null)
            return NotFound("Aluno não encontrado.");

        var messages = await _context.ChatMessages
            .Where(m => m.StudentId == studentId && !m.IsDeleted)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();

        // Marcar mensagens do professor como lidas pelo aluno
        var unreadFromProfessor = messages
            .Where(m => m.SenderType == MessageSenderType.Professor && !m.IsReadByStudent)
            .ToList();

        if (unreadFromProfessor.Any())
        {
            foreach (var msg in unreadFromProfessor)
            {
                msg.IsReadByStudent = true;
                msg.UpdatedAt = DateTime.UtcNow;
            }
            await _context.SaveChangesAsync();
        }

        var dtos = _mapper.Map<List<ChatMessageDto>>(messages);
        return Ok(dtos);
    }

    [HttpPost("{studentId}/messages")]
    public async Task<ActionResult<ChatMessageDto>> SendStudentMessage(Guid studentId, [FromBody] SendChatMessageDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto?.Content))
            return BadRequest("A mensagem não pode estar vazia.");

        var student = await _context.Students
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == studentId && !s.IsDeleted);

        if (student == null)
            return NotFound("Aluno não encontrado.");

        var message = new ChatMessage
        {
            Id = Guid.NewGuid(),
            StudentId = student.Id,
            ProfessorId = student.ProfessorId,
            SenderType = MessageSenderType.Student,
            Content = dto.Content.Trim(),
            IsReadByStudent = true,
            IsReadByProfessor = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.ChatMessages.Add(message);
        await _context.SaveChangesAsync();

        var messageDto = _mapper.Map<ChatMessageDto>(message);
        return Created($"/api/public/student/{studentId}/messages/{message.Id}", messageDto);
    }
}
