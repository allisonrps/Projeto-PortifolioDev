using Microsoft.EntityFrameworkCore;
using AutoMapper;
using Aura.Application.DTOs.Activity;
using Aura.Application.Services;
using Aura.Domain.Entities;
using Aura.Infrastructure.Data;
using Aura.Infrastructure.Security;

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
        var subjectValid = await _context.Subjects
            .AnyAsync(s => s.Id == dto.SubjectId && s.ProfessorId == professorId);
        if (!subjectValid)
            throw new UnauthorizedAccessException("Matéria inválida ou sem permissão.");

        var template = new TemplateActivity
        {
            ProfessorId = professorId,
            SubjectId = dto.SubjectId,
            LevelId = dto.LevelId,
            Title = dto.Title,
            Type = dto.Type,
            MaxGrade = dto.MaxGrade
        };

        var baseTime = DateTime.UtcNow;
        var index = 0;
        foreach (var q in dto.Questions)
        {
            var isTextBlock = q.QuestionType == "text_block";
            template.Questions.Add(new TemplateQuestion
            {
                CreatedAt = baseTime.AddMilliseconds(index++ * 10),
                QuestionText = q.QuestionText,
                QuestionType = q.QuestionType,
                OptionA = isTextBlock ? null : q.OptionA,
                OptionB = isTextBlock ? null : q.OptionB,
                OptionC = isTextBlock ? null : q.OptionC,
                OptionD = isTextBlock ? null : q.OptionD,
                CorrectOption = isTextBlock ? null : (q.CorrectOption.HasValue ? char.ToUpper(q.CorrectOption.Value) : null),
                Weight = isTextBlock ? 0m : q.Weight
            });
        }

        _context.TemplateActivities.Add(template);
        await _context.SaveChangesAsync();

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

    public async Task<TemplateResponseDto> UpdateTemplateAsync(Guid professorId, Guid templateId, CreateTemplateDto dto)
    {
        var template = await _context.TemplateActivities
            .Include(ta => ta.Questions)
            .Where(ta => ta.ProfessorId == professorId && ta.Id == templateId)
            .FirstOrDefaultAsync() ?? throw new KeyNotFoundException("Modelo não encontrado.");

        var subjectValid = await _context.Subjects
            .AnyAsync(s => s.Id == dto.SubjectId && s.ProfessorId == professorId);
        if (!subjectValid)
            throw new UnauthorizedAccessException("Matéria inválida ou sem permissão.");

        template.Title = dto.Title;
        template.Type = dto.Type;
        template.SubjectId = dto.SubjectId;
        template.LevelId = dto.LevelId;
        template.MaxGrade = dto.MaxGrade;

        if (template.Questions.Any())
        {
            _context.TemplateQuestions.RemoveRange(template.Questions);
            await _context.SaveChangesAsync();
        }
        template.Questions.Clear();

        var baseTime = DateTime.UtcNow;
        var index = 0;
        foreach (var q in dto.Questions)
        {
            var isTextBlock = q.QuestionType == "text_block";
            var newQuestion = new TemplateQuestion
            {
                TemplateActivityId = template.Id,
                CreatedAt = baseTime.AddMilliseconds(index++ * 10),
                QuestionText = q.QuestionText,
                QuestionType = q.QuestionType,
                OptionA = isTextBlock ? null : q.OptionA,
                OptionB = isTextBlock ? null : q.OptionB,
                OptionC = isTextBlock ? null : q.OptionC,
                OptionD = isTextBlock ? null : q.OptionD,
                CorrectOption = isTextBlock ? null : (q.CorrectOption.HasValue ? char.ToUpper(q.CorrectOption.Value) : null),
                Weight = isTextBlock ? 0m : q.Weight
            };

            _context.Entry(newQuestion).State = EntityState.Added;
            template.Questions.Add(newQuestion);
        }

        await _context.SaveChangesAsync();

        var reloaded = await _context.TemplateActivities
            .Include(ta => ta.Subject)
            .Include(ta => ta.Level)
            .Include(ta => ta.Questions)
            .FirstAsync(ta => ta.Id == template.Id);

        return _mapper.Map<TemplateResponseDto>(reloaded);
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
        var student = await _context.Students
            .Where(s => s.Id == dto.StudentId && s.ProfessorId == professorId)
            .FirstOrDefaultAsync() ?? throw new KeyNotFoundException("Aluno não encontrado.");

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
            MaxGrade = template.MaxGrade
        };

        var baseTime = DateTime.UtcNow;
        var index = 0;
        foreach (var q in template.Questions.OrderBy(x => x.CreatedAt))
        {
            studentActivity.Answers.Add(new StudentAnswer
            {
                CreatedAt = baseTime.AddMilliseconds(index++ * 10),
                QuestionText = q.QuestionText,
                QuestionType = q.QuestionType,
                OptionA = q.OptionA,
                OptionB = q.OptionB,
                OptionC = q.OptionC,
                OptionD = q.OptionD,
                CorrectOption = q.CorrectOption,
                Weight = q.Weight,
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

    public async Task<List<StudentActivityResponseDto>> GetStudentActivitiesAsync(Guid professorId, Guid studentId)
    {
        var studentExists = await _context.Students
            .AnyAsync(s => s.Id == studentId && s.ProfessorId == professorId);
        if (!studentExists)
            throw new UnauthorizedAccessException("Acesso negado às atividades deste aluno.");

        var activities = await _context.StudentActivities
            .Include(sa => sa.Student)
            .Include(sa => sa.TemplateActivity)
            .Include(sa => sa.Answers)
            .Where(sa => sa.StudentId == studentId && sa.Student.ProfessorId == professorId)
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

        var dto = _mapper.Map<StudentActivityResponseDto>(activity);
        
        if (activity.Status == "pending" || activity.Status == "corrigir")
        {
            foreach (var a in dto.Answers)
            {
                a.CorrectOption = null;
            }
        }

        return dto;
    }

    public async Task<StudentActivityResponseDto> SubmitActivityAsync(Guid activityId, SubmitActivityDto dto)
    {
        var activity = await _context.StudentActivities
            .Include(sa => sa.Answers)
            .Where(sa => sa.Id == activityId)
            .FirstOrDefaultAsync() ?? throw new KeyNotFoundException("Atividade não encontrada.");

        if (activity.Status == "completed" || activity.Status == "corrigir")
            throw new InvalidOperationException("Esta atividade já foi finalizada.");

        foreach (var subAns in dto.Answers)
        {
            var dbAnswer = activity.Answers.FirstOrDefault(a => a.Id == subAns.QuestionId);
            if (dbAnswer != null)
            {
                if (dbAnswer.QuestionType == "writing")
                {
                    dbAnswer.WrittenAnswer = subAns.WrittenAnswer;
                    dbAnswer.SelectedOption = null;
                }
                else
                {
                    dbAnswer.SelectedOption = subAns.SelectedOption.HasValue ? char.ToUpper(subAns.SelectedOption.Value) : null;
                    dbAnswer.WrittenAnswer = null;
                }
            }
        }

        bool hasWriting = activity.Answers.Any(a => a.QuestionType == "writing");

        if (hasWriting)
        {
            activity.Status = "corrigir";
            activity.Grade = null;
        }
        else
        {
            decimal totalWeight = 0;
            decimal earnedPoints = 0;

            foreach (var answer in activity.Answers)
            {
                if (answer.QuestionType == "text_block") continue;

                totalWeight += answer.Weight;

                if (answer.QuestionType == "multiple_choice" && answer.SelectedOption.HasValue && answer.CorrectOption.HasValue)
                {
                    if (answer.SelectedOption.Value == answer.CorrectOption.Value)
                    {
                        earnedPoints += answer.Weight;
                    }
                }
            }

            activity.Grade = totalWeight > 0 
                ? Math.Round((earnedPoints / totalWeight) * activity.MaxGrade, 2)
                : activity.MaxGrade;

            activity.Status = "completed";
        }

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
        var activity = await _context.StudentActivities
            .Include(sa => sa.Student)
            .Include(sa => sa.TemplateActivity)
            .Include(sa => sa.Answers)
            .Where(sa => sa.Id == activityId && sa.Student.ProfessorId == professorId)
            .FirstOrDefaultAsync() ?? throw new KeyNotFoundException("Atividade não encontrada ou sem permissão de acesso.");

        return _mapper.Map<StudentActivityResponseDto>(activity);
    }

    public async Task<StudentActivityResponseDto> CorrectActivityAsync(Guid professorId, Guid activityId, CorrectActivityDto dto)
    {
        var activity = await _context.StudentActivities
            .Include(sa => sa.Student)
            .Include(sa => sa.Answers)
            .Where(sa => sa.Id == activityId && sa.Student.ProfessorId == professorId)
            .FirstOrDefaultAsync() ?? throw new KeyNotFoundException("Atividade não encontrada ou sem permissão.");

        if (activity.Status != "corrigir" && activity.Status != "completed")
            throw new InvalidOperationException("Esta atividade não pode ser corrigida.");

        foreach (var correction in dto.Corrections)
        {
            var dbAnswer = activity.Answers.FirstOrDefault(a => a.Id == correction.AnswerId);
            if (dbAnswer != null && dbAnswer.QuestionType == "writing")
            {
                dbAnswer.EvaluationMention = null;
                dbAnswer.EvaluationNotes = HtmlSanitizerHelper.Sanitize(correction.Notes);
                dbAnswer.EvaluationScore = correction.Score;
                _context.Entry(dbAnswer).State = EntityState.Modified;
            }
        }

        decimal totalWeight = activity.Answers.Where(a => a.QuestionType != "text_block").Sum(a => a.Weight);
        decimal totalGrade = 0;

        foreach (var answer in activity.Answers)
        {
            if (answer.QuestionType == "text_block") continue;

            if (answer.QuestionType == "writing")
            {
                totalGrade += answer.EvaluationScore ?? 0;
            }
            else
            {
                if (answer.SelectedOption.HasValue && answer.CorrectOption.HasValue &&
                    answer.SelectedOption.Value == answer.CorrectOption.Value)
                {
                    decimal questionValue = totalWeight > 0 
                        ? (answer.Weight / totalWeight) * activity.MaxGrade 
                        : 0;
                    totalGrade += questionValue;
                }
            }
        }

        activity.Grade = Math.Round(totalGrade, 2);
        activity.Status = "completed";

        _context.StudentActivities.Update(activity);
        await _context.SaveChangesAsync();

        var reloaded = await _context.StudentActivities
            .Include(sa => sa.Student)
            .Include(sa => sa.TemplateActivity)
            .Include(sa => sa.Answers)
            .FirstAsync(sa => sa.Id == activity.Id);

        return _mapper.Map<StudentActivityResponseDto>(reloaded);
    }

    public async Task DeleteStudentActivityAsync(Guid professorId, Guid activityId)
    {
        var activity = await _context.StudentActivities
            .Include(sa => sa.Student)
            .Include(sa => sa.Answers)
            .Where(sa => sa.Id == activityId && sa.Student.ProfessorId == professorId)
            .FirstOrDefaultAsync() ?? throw new KeyNotFoundException("Atividade não encontrada ou sem permissão.");

        _context.StudentAnswers.RemoveRange(activity.Answers);
        _context.StudentActivities.Remove(activity);
        
        await _context.SaveChangesAsync();
    }
}
