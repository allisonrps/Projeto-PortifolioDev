using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Aura.Application.DTOs.Backup;
using Aura.Application.Services;
using Aura.Domain.Entities;
using Aura.Infrastructure.Data;
using Aura.Infrastructure.Security;

namespace Aura.Infrastructure.Services;

public class BackupService : IBackupService
{
    private readonly AuraDbContext _context;

    public BackupService(AuraDbContext context)
    {
        _context = context;
    }

    public async Task<BackupDto> ExportBackupAsync(Guid professorId)
    {
        var professor = await _context.Professors
            .FirstOrDefaultAsync(p => p.Id == professorId)
            ?? throw new KeyNotFoundException("Professor não encontrado.");

        var subjects = await _context.Subjects
            .Include(s => s.Levels)
            .Where(s => s.ProfessorId == professorId)
            .ToListAsync();

        var students = await _context.Students
            .Where(s => s.ProfessorId == professorId)
            .ToListAsync();

        var studentIds = students.Select(s => s.Id).ToList();

        var payments = await _context.MonthlyPayments
            .Where(p => studentIds.Contains(p.StudentId))
            .ToListAsync();

        var exams = await _context.Exams
            .Where(e => studentIds.Contains(e.StudentId))
            .ToListAsync();

        var exercises = await _context.Exercises
            .Where(e => studentIds.Contains(e.StudentId))
            .ToListAsync();

        var studentActivities = await _context.StudentActivities
            .Include(sa => sa.Answers)
            .Where(sa => studentIds.Contains(sa.StudentId))
            .ToListAsync();

        var lessons = await _context.Lessons
            .Where(l => l.ProfessorId == professorId)
            .ToListAsync();

        var schedules = await _context.Schedules
            .Where(s => s.ProfessorId == professorId)
            .ToListAsync();

        var holidays = await _context.Holidays
            .Where(h => h.ProfessorId == professorId)
            .ToListAsync();

        var templates = await _context.TemplateActivities
            .Include(ta => ta.Questions)
            .Where(ta => ta.ProfessorId == professorId)
            .ToListAsync();

        var backup = new BackupDto
        {
            Professor = new ProfessorBackupDto
            {
                Name = professor.Name,
                Phone = professor.Phone,
                Theme = professor.Theme,
                PrimaryColor = professor.PrimaryColor,
                SecondaryColor = professor.SecondaryColor
            },
            Subjects = subjects.Select(s => new SubjectBackupDto
            {
                Id = s.Id,
                Name = s.Name,
                Levels = s.Levels.Select(l => new LevelBackupDto
                {
                    Id = l.Id,
                    Name = l.Name
                }).ToList()
            }).ToList(),
            Students = students.Select(s => new StudentBackupDto
            {
                Id = s.Id,
                SubjectId = s.SubjectId,
                LevelId = s.LevelId,
                Name = s.Name,
                BirthDate = s.BirthDate,
                Phone = s.Phone,
                Observation = s.Observation,
                PhotoUrl = s.PhotoUrl,
                Payments = payments.Where(p => p.StudentId == s.Id).Select(p => new MonthlyPaymentBackupDto
                {
                    Id = p.Id,
                    Month = p.Month,
                    Year = p.Year,
                    Amount = p.Amount,
                    IsPaid = p.IsPaid,
                    PaidAt = p.PaidAt
                }).ToList(),
                Exams = exams.Where(e => e.StudentId == s.Id).Select(e => new ExamBackupDto
                {
                    Id = e.Id,
                    Title = e.Title,
                    ScheduledAt = e.ScheduledAt,
                    Notes = e.Notes,
                    Grade = e.Grade,
                    MaxGrade = e.MaxGrade
                }).ToList(),
                Exercises = exercises.Where(e => e.StudentId == s.Id).Select(e => new ExerciseBackupDto
                {
                    Id = e.Id,
                    Title = e.Title,
                    ScheduledAt = e.ScheduledAt,
                    Notes = e.Notes,
                    Grade = e.Grade,
                    MaxGrade = e.MaxGrade
                }).ToList(),
                StudentActivities = studentActivities.Where(sa => sa.StudentId == s.Id).Select(sa => new StudentActivityBackupDto
                {
                    Id = sa.Id,
                    TemplateActivityId = sa.TemplateActivityId,
                    ScheduledAt = sa.ScheduledAt,
                    CompletedAt = sa.CompletedAt,
                    Grade = sa.Grade,
                    MaxGrade = sa.MaxGrade,
                    Status = sa.Status,
                    Answers = sa.Answers.Select(an => new StudentAnswerBackupDto
                    {
                        Id = an.Id,
                        QuestionText = an.QuestionText,
                        QuestionType = an.QuestionType,
                        OptionA = an.OptionA,
                        OptionB = an.OptionB,
                        OptionC = an.OptionC,
                        OptionD = an.OptionD,
                        CorrectOption = an.CorrectOption,
                        SelectedOption = an.SelectedOption,
                        WrittenAnswer = an.WrittenAnswer,
                        EvaluationMention = an.EvaluationMention,
                        EvaluationScore = an.EvaluationScore,
                        Weight = an.Weight,
                        EvaluationNotes = an.EvaluationNotes
                    }).ToList()
                }).ToList()
            }).ToList(),
            Lessons = lessons.Select(l => new LessonBackupDto
            {
                Id = l.Id,
                StudentId = l.StudentId,
                Title = l.Title,
                ScheduledAt = l.ScheduledAt,
                DurationMinutes = l.DurationMinutes,
                Status = l.Status,
                Notes = l.Notes
            }).ToList(),
            Schedules = schedules.Select(s => new ScheduleBackupDto
            {
                Id = s.Id,
                StudentId = s.StudentId,
                DayOfWeek = s.DayOfWeek,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                IsRecurring = s.IsRecurring,
                ValidFrom = s.ValidFrom,
                ValidUntil = s.ValidUntil
            }).ToList(),
            Holidays = holidays.Select(h => new HolidayBackupDto
            {
                Id = h.Id,
                Name = h.Name,
                Date = h.Date,
                IsVacationPeriod = h.IsVacationPeriod,
                VacationStart = h.VacationStart,
                VacationEnd = h.VacationEnd
            }).ToList(),
            TemplateActivities = templates.Select(t => new TemplateActivityBackupDto
            {
                Id = t.Id,
                SubjectId = t.SubjectId,
                LevelId = t.LevelId,
                Title = t.Title,
                Type = t.Type,
                MaxGrade = t.MaxGrade,
                Questions = t.Questions.Select(q => new TemplateQuestionBackupDto
                {
                    Id = q.Id,
                    QuestionText = q.QuestionText,
                    QuestionType = q.QuestionType,
                    OptionA = q.OptionA,
                    OptionB = q.OptionB,
                    OptionC = q.OptionC,
                    OptionD = q.OptionD,
                    CorrectOption = q.CorrectOption,
                    Weight = q.Weight
                }).ToList()
            }).ToList()
        };

        return backup;
    }

    public async Task ImportBackupAsync(Guid professorId, BackupDto backupDto)
    {
        if (backupDto == null)
            throw new ArgumentNullException(nameof(backupDto), "O payload de backup está nulo.");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var studentAnswers = await _context.StudentAnswers.IgnoreQueryFilters()
                .Where(sa => sa.StudentActivity.Student.ProfessorId == professorId)
                .ToListAsync();
            _context.StudentAnswers.RemoveRange(studentAnswers);

            var studentActivities = await _context.StudentActivities.IgnoreQueryFilters()
                .Where(sa => sa.Student.ProfessorId == professorId)
                .ToListAsync();
            _context.StudentActivities.RemoveRange(studentActivities);

            var templateQuestions = await _context.TemplateQuestions.IgnoreQueryFilters()
                .Where(tq => tq.TemplateActivity.ProfessorId == professorId)
                .ToListAsync();
            _context.TemplateQuestions.RemoveRange(templateQuestions);

            var templateActivities = await _context.TemplateActivities.IgnoreQueryFilters()
                .Where(ta => ta.ProfessorId == professorId)
                .ToListAsync();
            _context.TemplateActivities.RemoveRange(templateActivities);

            var payments = await _context.MonthlyPayments.IgnoreQueryFilters()
                .Where(p => p.Student.ProfessorId == professorId)
                .ToListAsync();
            _context.MonthlyPayments.RemoveRange(payments);

            var exams = await _context.Exams.IgnoreQueryFilters()
                .Where(e => e.Student.ProfessorId == professorId)
                .ToListAsync();
            _context.Exams.RemoveRange(exams);

            var exercises = await _context.Exercises.IgnoreQueryFilters()
                .Where(e => e.Student.ProfessorId == professorId)
                .ToListAsync();
            _context.Exercises.RemoveRange(exercises);

            var lessons = await _context.Lessons.IgnoreQueryFilters()
                .Where(l => l.ProfessorId == professorId)
                .ToListAsync();
            _context.Lessons.RemoveRange(lessons);

            var schedules = await _context.Schedules.IgnoreQueryFilters()
                .Where(s => s.ProfessorId == professorId)
                .ToListAsync();
            _context.Schedules.RemoveRange(schedules);

            var students = await _context.Students.IgnoreQueryFilters()
                .Where(s => s.ProfessorId == professorId)
                .ToListAsync();
            _context.Students.RemoveRange(students);

            var levels = await _context.Levels.IgnoreQueryFilters()
                .Where(l => l.Subject.ProfessorId == professorId)
                .ToListAsync();
            _context.Levels.RemoveRange(levels);

            var subjects = await _context.Subjects.IgnoreQueryFilters()
                .Where(s => s.ProfessorId == professorId)
                .ToListAsync();
            _context.Subjects.RemoveRange(subjects);

            var holidays = await _context.Holidays.IgnoreQueryFilters()
                .Where(h => h.ProfessorId == professorId)
                .ToListAsync();
            _context.Holidays.RemoveRange(holidays);

            await _context.SaveChangesAsync();

            var professor = await _context.Professors.FirstOrDefaultAsync(p => p.Id == professorId);
            if (professor != null && backupDto.Professor != null)
            {
                professor.Name = backupDto.Professor.Name;
                if (!string.IsNullOrEmpty(backupDto.Professor.Phone)) professor.Phone = backupDto.Professor.Phone;
                professor.Theme = backupDto.Professor.Theme;
                professor.PrimaryColor = backupDto.Professor.PrimaryColor;
                professor.SecondaryColor = backupDto.Professor.SecondaryColor;
                _context.Professors.Update(professor);
            }

            // Map old IDs to fresh IDs to prevent cross-tenant PK collisions or foreign key hijacking
            var subjectIdMap = new Dictionary<Guid, Guid>();
            var levelIdMap = new Dictionary<Guid, Guid>();
            var studentIdMap = new Dictionary<Guid, Guid>();
            var templateIdMap = new Dictionary<Guid, Guid>();

            foreach (var sDto in backupDto.Subjects)
            {
                var newSubjectId = Guid.NewGuid();
                subjectIdMap[sDto.Id] = newSubjectId;

                var subject = new Subject
                {
                    Id = newSubjectId,
                    ProfessorId = professorId,
                    Name = sDto.Name
                };
                await _context.Subjects.AddAsync(subject);

                foreach (var lDto in sDto.Levels)
                {
                    var newLevelId = Guid.NewGuid();
                    levelIdMap[lDto.Id] = newLevelId;

                    var level = new Level
                    {
                        Id = newLevelId,
                        SubjectId = newSubjectId,
                        Name = lDto.Name
                    };
                    await _context.Levels.AddAsync(level);
                }
            }

            foreach (var hDto in backupDto.Holidays)
            {
                var holiday = new Holiday
                {
                    Id = Guid.NewGuid(),
                    ProfessorId = professorId,
                    Name = hDto.Name,
                    Date = hDto.Date,
                    IsVacationPeriod = hDto.IsVacationPeriod,
                    VacationStart = hDto.VacationStart,
                    VacationEnd = hDto.VacationEnd
                };
                await _context.Holidays.AddAsync(holiday);
            }

            foreach (var sDto in backupDto.Students)
            {
                if (!subjectIdMap.TryGetValue(sDto.SubjectId, out var mappedSubjectId) ||
                    !levelIdMap.TryGetValue(sDto.LevelId, out var mappedLevelId))
                {
                    continue;
                }

                var newStudentId = Guid.NewGuid();
                studentIdMap[sDto.Id] = newStudentId;

                var student = new Student
                {
                    Id = newStudentId,
                    ProfessorId = professorId,
                    SubjectId = mappedSubjectId,
                    LevelId = mappedLevelId,
                    Name = sDto.Name,
                    BirthDate = sDto.BirthDate,
                    Phone = sDto.Phone,
                    Observation = sDto.Observation,
                    PhotoUrl = sDto.PhotoUrl
                };
                await _context.Students.AddAsync(student);

                foreach (var pDto in sDto.Payments)
                {
                    var payment = new MonthlyPayment
                    {
                        Id = Guid.NewGuid(),
                        StudentId = newStudentId,
                        Month = pDto.Month,
                        Year = pDto.Year,
                        Amount = pDto.Amount,
                        IsPaid = pDto.IsPaid,
                        PaidAt = pDto.PaidAt
                    };
                    await _context.MonthlyPayments.AddAsync(payment);
                }

                foreach (var eDto in sDto.Exams)
                {
                    var exam = new Exam
                    {
                        Id = Guid.NewGuid(),
                        StudentId = newStudentId,
                        Title = eDto.Title,
                        ScheduledAt = eDto.ScheduledAt,
                        Notes = eDto.Notes,
                        Grade = eDto.Grade,
                        MaxGrade = eDto.MaxGrade
                    };
                    await _context.Exams.AddAsync(exam);
                }

                foreach (var exDto in sDto.Exercises)
                {
                    var exercise = new Exercise
                    {
                        Id = Guid.NewGuid(),
                        StudentId = newStudentId,
                        Title = exDto.Title,
                        ScheduledAt = exDto.ScheduledAt,
                        Notes = exDto.Notes,
                        Grade = exDto.Grade,
                        MaxGrade = exDto.MaxGrade
                    };
                    await _context.Exercises.AddAsync(exercise);
                }
            }

            foreach (var tDto in backupDto.TemplateActivities)
            {
                if (!subjectIdMap.TryGetValue(tDto.SubjectId, out var mappedSubjectId) ||
                    !levelIdMap.TryGetValue(tDto.LevelId, out var mappedLevelId))
                {
                    continue;
                }

                var newTemplateId = Guid.NewGuid();
                templateIdMap[tDto.Id] = newTemplateId;

                var template = new TemplateActivity
                {
                    Id = newTemplateId,
                    ProfessorId = professorId,
                    SubjectId = mappedSubjectId,
                    LevelId = mappedLevelId,
                    Title = tDto.Title,
                    Type = tDto.Type,
                    MaxGrade = tDto.MaxGrade
                };
                await _context.TemplateActivities.AddAsync(template);

                foreach (var qDto in tDto.Questions)
                {
                    var q = new TemplateQuestion
                    {
                        Id = Guid.NewGuid(),
                        TemplateActivityId = newTemplateId,
                        QuestionText = qDto.QuestionText,
                        QuestionType = qDto.QuestionType,
                        OptionA = qDto.OptionA,
                        OptionB = qDto.OptionB,
                        OptionC = qDto.OptionC,
                        OptionD = qDto.OptionD,
                        CorrectOption = qDto.CorrectOption,
                        Weight = qDto.Weight
                    };
                    await _context.TemplateQuestions.AddAsync(q);
                }
            }

            foreach (var sDto in backupDto.Students)
            {
                if (!studentIdMap.TryGetValue(sDto.Id, out var mappedStudentId))
                    continue;

                foreach (var saDto in sDto.StudentActivities)
                {
                    if (!templateIdMap.TryGetValue(saDto.TemplateActivityId, out var mappedTemplateId))
                        continue;

                    var newStudentActivityId = Guid.NewGuid();
                    var studentActivity = new StudentActivity
                    {
                        Id = newStudentActivityId,
                        StudentId = mappedStudentId,
                        TemplateActivityId = mappedTemplateId,
                        ScheduledAt = saDto.ScheduledAt,
                        CompletedAt = saDto.CompletedAt,
                        Grade = saDto.Grade,
                        MaxGrade = saDto.MaxGrade,
                        Status = saDto.Status
                    };
                    await _context.StudentActivities.AddAsync(studentActivity);

                    foreach (var anDto in saDto.Answers)
                    {
                        var answer = new StudentAnswer
                        {
                            Id = Guid.NewGuid(),
                            StudentActivityId = newStudentActivityId,
                            QuestionText = anDto.QuestionText,
                            QuestionType = anDto.QuestionType,
                            OptionA = anDto.OptionA,
                            OptionB = anDto.OptionB,
                            OptionC = anDto.OptionC,
                            OptionD = anDto.OptionD,
                            CorrectOption = anDto.CorrectOption,
                            SelectedOption = anDto.SelectedOption,
                            WrittenAnswer = anDto.WrittenAnswer,
                            EvaluationMention = anDto.EvaluationMention,
                            EvaluationScore = anDto.EvaluationScore,
                            Weight = anDto.Weight,
                            EvaluationNotes = HtmlSanitizerHelper.Sanitize(anDto.EvaluationNotes)
                        };
                        await _context.StudentAnswers.AddAsync(answer);
                    }
                }
            }

            foreach (var lDto in backupDto.Lessons)
            {
                if (!studentIdMap.TryGetValue(lDto.StudentId, out var mappedStudentId))
                    continue;

                var lesson = new Lesson
                {
                    Id = Guid.NewGuid(),
                    ProfessorId = professorId,
                    StudentId = mappedStudentId,
                    Title = lDto.Title,
                    ScheduledAt = lDto.ScheduledAt,
                    DurationMinutes = lDto.DurationMinutes,
                    Status = lDto.Status,
                    Notes = lDto.Notes
                };
                await _context.Lessons.AddAsync(lesson);
            }

            foreach (var sdDto in backupDto.Schedules)
            {
                if (!studentIdMap.TryGetValue(sdDto.StudentId, out var mappedStudentId))
                    continue;

                var schedule = new Schedule
                {
                    Id = Guid.NewGuid(),
                    ProfessorId = professorId,
                    StudentId = mappedStudentId,
                    DayOfWeek = sdDto.DayOfWeek,
                    StartTime = sdDto.StartTime,
                    EndTime = sdDto.EndTime,
                    IsRecurring = sdDto.IsRecurring,
                    ValidFrom = sdDto.ValidFrom,
                    ValidUntil = sdDto.ValidUntil
                };
                await _context.Schedules.AddAsync(schedule);
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
