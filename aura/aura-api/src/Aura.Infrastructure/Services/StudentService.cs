using AutoMapper;
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
    private readonly IMapper _mapper;
    private readonly IFileStorageService _fileStorage;

    private static readonly Dictionary<string, int> PlanLimits = new()
    {
        { "free", 2 }, { "basic", 10 }, { "standard", 25 }, { "premium", int.MaxValue }
    };

    public StudentService(IStudentRepository studentRepo, ISubjectRepository subjectRepo, ILevelRepository levelRepo, IMapper mapper, IFileStorageService fileStorage)
    {
        _studentRepo = studentRepo;
        _subjectRepo = subjectRepo;
        _levelRepo = levelRepo;
        _mapper = mapper;
        _fileStorage = fileStorage;
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
        return _mapper.Map<StudentDetailDto>(student);
    }

    public async Task<StudentResponseDto> CreateAsync(Guid professorId, CreateStudentDto dto)
    {
        // Check if Subject exists or auto-assign/create default
        var subject = dto.SubjectId != Guid.Empty ? await _subjectRepo.GetByIdAsync(dto.SubjectId) : null;
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

        // Check if Level exists or auto-assign/create default
        var level = dto.LevelId != Guid.Empty ? await _levelRepo.GetByIdAsync(dto.LevelId) : null;
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

        var count = await _studentRepo.CountByProfessorIdAsync(professorId);

        var student = _mapper.Map<Student>(dto);
        student.ProfessorId = professorId;
        student.FirstClassDate = dto.FirstClassDate;
        await _studentRepo.AddAsync(student);

        // Reload with includes
        var loaded = await _studentRepo.GetDetailByIdAsync(student.Id);
        return _mapper.Map<StudentResponseDto>(loaded ?? student);
    }

    public async Task<StudentResponseDto> UpdateAsync(Guid id, Guid professorId, UpdateStudentDto dto)
    {
        var student = await _studentRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Aluno não encontrado.");
        if (student.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        if (dto.Name != null) student.Name = dto.Name;
        if (dto.BirthDate.HasValue) student.BirthDate = dto.BirthDate;
        if (dto.Phone != null) student.Phone = dto.Phone;
        if (dto.GuardianName != null) student.GuardianName = dto.GuardianName;
        if (dto.GuardianPhone != null) student.GuardianPhone = dto.GuardianPhone;
        if (dto.SubjectId.HasValue) student.SubjectId = dto.SubjectId.Value;
        if (dto.LevelId.HasValue) student.LevelId = dto.LevelId.Value;
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

        await _studentRepo.UpdateAsync(student);
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
