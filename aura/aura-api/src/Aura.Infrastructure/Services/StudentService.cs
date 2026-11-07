using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Aura.Application.DTOs.Students;
using Aura.Application.Services;
using Aura.Domain.Entities;
using Aura.Domain.Interfaces;

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
                subject = new Subject { ProfessorId = professorId, Name = "Geral" };
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
}
