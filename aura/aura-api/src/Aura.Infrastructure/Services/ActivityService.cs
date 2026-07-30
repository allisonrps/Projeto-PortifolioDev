using Microsoft.EntityFrameworkCore;
using AutoMapper;
using Aura.Application.DTOs.Activity;
using Aura.Application.Services;
using Aura.Domain.Entities;
using Aura.Infrastructure.Data;

namespace Aura.Infrastructure.Services;

public class ActivityService : IActivityService
{
    private readonly AuraDbContext _context;
    private readonly IMapper _mapper;

    public ActivityService(AuraDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<TemplateResponseDto> CreateTemplateAsync(Guid professorId, CreateTemplateDto dto)
    {
        var template = new TemplateActivity
        {
            ProfessorId = professorId,
            SubjectId = dto.SubjectId,
            LevelId = dto.LevelId,
            Title = dto.Title,
            Type = dto.Type
        };

        foreach (var q in dto.Questions)
        {
            template.Questions.Add(new TemplateQuestion
            {
                QuestionText = q.QuestionText,
                OptionA = q.OptionA,
                OptionB = q.OptionB,
                OptionC = q.OptionC,
                OptionD = q.OptionD,
                CorrectOption = char.ToUpper(q.CorrectOption)
            });
        }

        _context.TemplateActivities.Add(template);
        await _context.SaveChangesAsync();

        // Reload to include relations
        var reloaded = await _context.TemplateActivities
            .Include(ta => ta.Subject)
            .Include(ta => ta.Level)
            .Include(ta => ta.Questions)
            .FirstAsync(ta => ta.Id == template.Id);

        return _mapper.Map<TemplateResponseDto>(reloaded);
    }

    public async Task<List<TemplateResponseDto>> GetTemplatesByProfessorAsync(Guid professorId)
    {
        var templates = await _context.TemplateActivities
            .Include(ta => ta.Subject)
            .Include(ta => ta.Level)
            .Include(ta => ta.Questions)
            .Where(ta => ta.ProfessorId == professorId)
            .OrderByDescending(ta => ta.CreatedAt)
            .ToListAsync();

        return _mapper.Map<List<TemplateResponseDto>>(templates);
    }

    public async Task DeleteTemplateAsync(Guid professorId, Guid templateId)
    {
        var template = await _context.TemplateActivities
            .Where(ta => ta.ProfessorId == professorId && ta.Id == templateId)
            .FirstOrDefaultAsync() ?? throw new KeyNotFoundException("Modelo não encontrado.");

        template.IsDeleted = true;
        await _context.SaveChangesAsync();
    }

    public async Task<StudentActivityResponseDto> AssignActivityToStudentAsync(Guid professorId, AssignActivityDto dto)
    {
        // Validate student exists
        var student = await _context.Students
            .Where(s => s.Id == dto.StudentId && s.ProfessorId == professorId)
            .FirstOrDefaultAsync() ?? throw new KeyNotFoundException("Aluno não encontrado.");

        // Validate template exists
        var template = await _context.TemplateActivities
            .Include(ta => ta.Questions)
            .Where(ta => ta.Id == dto.TemplateActivityId && ta.ProfessorId == professorId)
            .FirstOrDefaultAsync() ?? throw new KeyNotFoundException("Modelo de atividade não encontrado.");

        var studentActivity = new StudentActivity
        {
            StudentId = dto.StudentId,
            TemplateActivityId = dto.TemplateActivityId,
            ScheduledAt = DateTime.UtcNow,
            Status = "pending",
            MaxGrade = 10
        };

        // Snapshot questions so changes in template don't alter past exams
        foreach (var q in template.Questions)
        {
            studentActivity.Answers.Add(new StudentAnswer
            {
                QuestionText = q.QuestionText,
                OptionA = q.OptionA,
                OptionB = q.OptionB,
                OptionC = q.OptionC,
                OptionD = q.OptionD,
                CorrectOption = q.CorrectOption,
                SelectedOption = null
            });
        }

        _context.StudentActivities.Add(studentActivity);
        await _context.SaveChangesAsync();

        var reloaded = await _context.StudentActivities
            .Include(sa => sa.Student)
            .Include(sa => sa.TemplateActivity)
            .Include(sa => sa.Answers)
            .FirstAsync(sa => sa.Id == studentActivity.Id);

        return _mapper.Map<StudentActivityResponseDto>(reloaded);
    }

    public async Task<List<StudentActivityResponseDto>> GetStudentActivitiesAsync(Guid studentId)
    {
        var activities = await _context.StudentActivities
            .Include(sa => sa.Student)
            .Include(sa => sa.TemplateActivity)
            .Include(sa => sa.Answers)
            .Where(sa => sa.StudentId == studentId)
            .OrderByDescending(sa => sa.ScheduledAt)
            .ToListAsync();

        return _mapper.Map<List<StudentActivityResponseDto>>(activities);
    }

    public async Task<StudentActivityResponseDto> GetStudentActivityForSubmissionAsync(Guid activityId)
    {
        var activity = await _context.StudentActivities
            .Include(sa => sa.Student)
            .Include(sa => sa.TemplateActivity)
            .Include(sa => sa.Answers)
            .Where(sa => sa.Id == activityId)
            .FirstOrDefaultAsync() ?? throw new KeyNotFoundException("Atividade não encontrada.");

        if (activity.Status == "completed")
            throw new InvalidOperationException("Esta atividade já foi finalizada pelo aluno.");

        // Map to DTO
        var dto = _mapper.Map<StudentActivityResponseDto>(activity);
        
        // Hide correct option to prevent cheating from browser inspection
        foreach (var a in dto.Answers)
        {
            a.CorrectOption = '\0';
        }

        return dto;
    }

    public async Task<StudentActivityResponseDto> SubmitActivityAsync(Guid activityId, SubmitActivityDto dto)
    {
        var activity = await _context.StudentActivities
            .Include(sa => sa.Answers)
            .Where(sa => sa.Id == activityId)
            .FirstOrDefaultAsync() ?? throw new KeyNotFoundException("Atividade não encontrada.");

        if (activity.Status == "completed")
            throw new InvalidOperationException("Esta atividade já foi finalizada.");

        int correctCount = 0;
        int totalQuestions = activity.Answers.Count;

        foreach (var subAns in dto.Answers)
        {
            var dbAnswer = activity.Answers.FirstOrDefault(a => a.Id == subAns.QuestionId);
            if (dbAnswer != null)
            {
                dbAnswer.SelectedOption = char.ToUpper(subAns.SelectedOption);
                if (dbAnswer.SelectedOption == dbAnswer.CorrectOption)
                {
                    correctCount++;
                }
            }
        }

        activity.Grade = totalQuestions > 0 
            ? Math.Round(((decimal)correctCount / totalQuestions) * activity.MaxGrade, 2)
            : activity.MaxGrade;

        activity.Status = "completed";
        activity.CompletedAt = DateTime.UtcNow;

        _context.StudentActivities.Update(activity);
        await _context.SaveChangesAsync();

        var reloaded = await _context.StudentActivities
            .Include(sa => sa.Student)
            .Include(sa => sa.TemplateActivity)
            .Include(sa => sa.Answers)
            .FirstAsync(sa => sa.Id == activity.Id);

        return _mapper.Map<StudentActivityResponseDto>(reloaded);
    }

    public async Task<StudentActivityResponseDto> GetActivityReviewAsync(Guid professorId, Guid activityId)
    {
        // Validates that the activity belongs to a student under this professor's scope
        var activity = await _context.StudentActivities
            .Include(sa => sa.Student)
            .Include(sa => sa.TemplateActivity)
            .Include(sa => sa.Answers)
            .Where(sa => sa.Id == activityId && sa.Student.ProfessorId == professorId)
            .FirstOrDefaultAsync() ?? throw new KeyNotFoundException("Atividade não encontrada ou sem permissão de acesso.");

        return _mapper.Map<StudentActivityResponseDto>(activity);
    }
}
