using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Aura.Application.DTOs.Students;
using Aura.Application.Services;
using Aura.Domain.Entities;
using Aura.Domain.Interfaces;
using SkiaSharp;

namespace Aura.Infrastructure.Services;

public class StudentService : IStudentService
{
    private readonly IStudentRepository _studentRepo;
    private readonly ISubjectRepository _subjectRepo;
    private readonly ILevelRepository _levelRepo;
    private readonly ILessonRepository _lessonRepo;
    private readonly IScheduleRepository _scheduleRepo;
    private readonly IMapper _mapper;
    private readonly IFileStorageService _fileStorage;

    public StudentService(
        IStudentRepository studentRepo,
        ISubjectRepository subjectRepo,
        ILevelRepository levelRepo,
        ILessonRepository lessonRepo,
        IScheduleRepository scheduleRepo,
        IMapper mapper,
        IFileStorageService fileStorage)
    {
        _studentRepo = studentRepo;
        _subjectRepo = subjectRepo;
        _levelRepo = levelRepo;
        _lessonRepo = lessonRepo;
        _scheduleRepo = scheduleRepo;
        _mapper = mapper;
        _fileStorage = fileStorage;
    }

    private async Task PurgeFutureLessonsAfterLastClassAsync(Student student)
    {
        if (student.IsActive && !student.LastClassDate.HasValue)
            return;

        var cutoffDate = (student.LastClassDate ?? DateTime.UtcNow).Date;
        var cutoffEndOfDay = cutoffDate.AddDays(1).AddTicks(-1);

        var futureLessons = await _lessonRepo.Query()
            .Where(l => l.StudentId == student.Id && !l.IsDeleted && l.ScheduledAt > cutoffEndOfDay)
            .ToListAsync();

        foreach (var lesson in futureLessons)
        {
            await _lessonRepo.DeleteAsync(lesson);
        }

        if (!student.IsActive)
        {
            var schedules = await _scheduleRepo.GetByStudentIdAsync(student.Id);
            foreach (var schedule in schedules)
            {
                if (!schedule.ValidUntil.HasValue || schedule.ValidUntil.Value.Date > cutoffDate)
                {
                    schedule.ValidUntil = cutoffDate;
                    await _scheduleRepo.UpdateAsync(schedule);
                }
            }
        }
    }

    public async Task<IEnumerable<StudentResponseDto>> GetByProfessorIdAsync(Guid professorId)
    {
        var students = await _studentRepo.GetByProfessorIdAsync(professorId);
        return _mapper.Map<IEnumerable<StudentResponseDto>>(students);
    }

    public async Task<StudentDetailDto> GetDetailAsync(Guid id, Guid professorId)
    {
        var student = await _studentRepo.GetDetailByIdAsync(id)
            ?? throw new KeyNotFoundException("Aluno não encontrado.");
        if (student.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        if (!student.IsActive || student.LastClassDate.HasValue)
        {
            var cutoffEndOfDay = (student.LastClassDate ?? DateTime.UtcNow).Date.AddDays(1).AddTicks(-1);
            if (student.Lessons.Any(l => l.ScheduledAt > cutoffEndOfDay))
            {
                await PurgeFutureLessonsAfterLastClassAsync(student);
                student = await _studentRepo.GetDetailByIdAsync(id) ?? student;
            }
        }

        return _mapper.Map<StudentDetailDto>(student);
    }

    public async Task<StudentResponseDto> CreateAsync(Guid professorId, CreateStudentDto dto)
    {
        var subject = dto.SubjectId != Guid.Empty ? await _subjectRepo.GetByIdAsync(dto.SubjectId) : null;
        if (subject != null && subject.ProfessorId != professorId)
            subject = null;

        if (subject == null)
        {
            var professorSubjects = await _subjectRepo.GetByProfessorIdAsync(professorId);
            subject = professorSubjects.FirstOrDefault();
            if (subject == null)
            {
                subject = new Subject { Name = "Geral", ProfessorId = professorId };
                await _subjectRepo.AddAsync(subject);
            }
            dto.SubjectId = subject.Id;
        }

        var level = dto.LevelId != Guid.Empty ? await _levelRepo.GetByIdAsync(dto.LevelId) : null;
        if (level != null && level.SubjectId != dto.SubjectId)
            level = null;

        if (level == null)
        {
            var subjectLevels = await _levelRepo.GetBySubjectIdAsync(dto.SubjectId);
            level = subjectLevels.FirstOrDefault();
            if (level == null)
            {
                level = new Level { SubjectId = dto.SubjectId, Name = "Geral" };
                await _levelRepo.AddAsync(level);
            }
            dto.LevelId = level.Id;
        }

        var student = _mapper.Map<Student>(dto);
        student.ProfessorId = professorId;
        student.FirstClassDate = dto.FirstClassDate;
        await _studentRepo.AddAsync(student);

        var loaded = await _studentRepo.GetDetailByIdAsync(student.Id);
        return _mapper.Map<StudentResponseDto>(loaded ?? student);
    }

    public async Task<StudentResponseDto> UpdateAsync(Guid id, Guid professorId, UpdateStudentDto dto)
    {
        var student = await _studentRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Aluno não encontrado.");
        if (student.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        if (dto.SubjectId.HasValue && dto.SubjectId.Value != Guid.Empty && dto.SubjectId.Value != student.SubjectId)
        {
            var subject = await _subjectRepo.GetByIdAsync(dto.SubjectId.Value);
            if (subject != null)
            {
                if (subject.ProfessorId != professorId)
                    throw new UnauthorizedAccessException("Acesso negado à matéria.");
                student.SubjectId = subject.Id;
            }
        }

        if (dto.LevelId.HasValue && dto.LevelId.Value != Guid.Empty && dto.LevelId.Value != student.LevelId)
        {
            var level = await _levelRepo.GetByIdAsync(dto.LevelId.Value);
            if (level != null && level.SubjectId == student.SubjectId)
            {
                student.LevelId = level.Id;
            }
            else if (level == null || level.SubjectId != student.SubjectId)
            {
                var subjectLevels = await _levelRepo.GetBySubjectIdAsync(student.SubjectId);
                var fallbackLevel = subjectLevels.FirstOrDefault();
                if (fallbackLevel != null)
                {
                    student.LevelId = fallbackLevel.Id;
                }
            }
        }

        if (dto.Name != null) student.Name = dto.Name;
        if (dto.BirthDate.HasValue) student.BirthDate = dto.BirthDate;
        if (dto.Phone != null) student.Phone = dto.Phone;
        if (dto.GuardianName != null) student.GuardianName = dto.GuardianName;
        if (dto.GuardianPhone != null) student.GuardianPhone = dto.GuardianPhone;
        if (dto.City != null) student.City = dto.City;
        if (dto.State != null) student.State = dto.State;
        if (dto.Country != null) student.Country = dto.Country;
        if (dto.Observation != null) student.Observation = dto.Observation;
        if (dto.MonthlyPrice.HasValue) student.MonthlyPrice = dto.MonthlyPrice.Value;
        if (dto.IsActive.HasValue) student.IsActive = dto.IsActive.Value;
        if (dto.FirstClassDate.HasValue) student.FirstClassDate = dto.FirstClassDate.Value;

        if (dto.IsActive.HasValue && dto.IsActive.Value)
        {
            student.LastClassDate = null;
        }
        else if (dto.LastClassDate.HasValue)
        {
            student.LastClassDate = dto.LastClassDate.Value;
        }
        else if (dto.IsActive.HasValue && !dto.IsActive.Value && !student.LastClassDate.HasValue)
        {
            student.LastClassDate = DateTime.UtcNow.Date;
        }

        await _studentRepo.UpdateAsync(student);

        if (!student.IsActive || student.LastClassDate.HasValue)
        {
            await PurgeFutureLessonsAfterLastClassAsync(student);
        }

        var loaded = await _studentRepo.GetDetailByIdAsync(student.Id);
        return _mapper.Map<StudentResponseDto>(loaded ?? student);
    }

    public async Task DeleteAsync(Guid id, Guid professorId)
    {
        var student = await _studentRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Aluno não encontrado.");
        if (student.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");
        await _studentRepo.DeleteAsync(student);
    }

    public async Task<string> UploadPhotoAsync(Guid id, Guid professorId, Stream stream, string fileName)
    {
        var student = await _studentRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Aluno não encontrado.");
        if (student.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        if (!string.IsNullOrEmpty(student.PhotoUrl))
            _fileStorage.DeleteFile(student.PhotoUrl);

        var photoUrl = await _fileStorage.SaveFileAsync(stream, fileName, "students");
        student.PhotoUrl = photoUrl;
        await _studentRepo.UpdateAsync(student);
        return photoUrl;
    }

    public async Task<string> UploadPhotoBase64Async(Guid id, Guid professorId, string base64)
    {
        var student = await _studentRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Aluno não encontrado.");
        if (student.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        if (string.IsNullOrWhiteSpace(base64))
            throw new ArgumentException("A imagem base64 não foi enviada.");

        // Remover prefixo data:image/...;base64, caso venha do frontend
        var base64Data = base64.Trim();
        var commaIndex = base64Data.IndexOf(',');
        if (commaIndex >= 0)
        {
            base64Data = base64Data.Substring(commaIndex + 1);
        }

        // Normalizar espaços e quebras de linha para evitar erro de Base64
        base64Data = base64Data.Replace(" ", "+").Replace("\r", "").Replace("\n", "");

        var imageBytes = Convert.FromBase64String(base64Data);
        if (imageBytes.Length == 0 || imageBytes.Length > 15 * 1024 * 1024)
            throw new ArgumentException("Tamanho de arquivo de imagem inválido.");

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
            throw new ArgumentException("Formato de imagem inválido. O arquivo enviado deve ser JPEG, PNG ou WebP.");
        }

        byte[] finalBytes = imageBytes;

        // Tentativa resiliente de processamento adicional com SkiaSharp.
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
            // Fallback silencioso mantendo os bytes limpos da imagem
        }

        // PERSISTÊNCIA PERMANENTE NO BANCO DE DADOS:
        // Salva como Data URI diretamente na coluna PhotoUrl da tabela Students.
        string mimeType = ext == "png" ? "image/png" : ext == "webp" ? "image/webp" : "image/jpeg";
        var persistentDataUrl = $"data:{mimeType};base64,{Convert.ToBase64String(finalBytes)}";
        student.PhotoUrl = persistentDataUrl;
        await _studentRepo.UpdateAsync(student);

        return persistentDataUrl;
    }
}
