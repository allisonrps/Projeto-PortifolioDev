using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Aura.Application.DTOs.Subjects;
using Aura.Application.DTOs.Students;
using Aura.Application.DTOs.Dashboard;
using Aura.Application.DTOs.Schedule;
using Aura.Application.Services;
using Aura.Domain.Entities;
using Aura.Domain.Interfaces;
using Aura.Infrastructure.Data;
using Aura.Infrastructure.Security;

namespace Aura.Infrastructure.Services;

public class SubjectService : ISubjectService
{
    private readonly ISubjectRepository _subjectRepo;
    private readonly IMapper _mapper;

    public SubjectService(ISubjectRepository subjectRepo, IMapper mapper)
    {
        _subjectRepo = subjectRepo;
        _mapper = mapper;
    }

    public async Task<IEnumerable<SubjectResponseDto>> GetByProfessorIdAsync(Guid professorId)
    {
        var subjects = await _subjectRepo.GetByProfessorIdAsync(professorId);
        return _mapper.Map<IEnumerable<SubjectResponseDto>>(subjects);
    }

    public async Task<SubjectResponseDto> GetByIdAsync(Guid id, Guid professorId)
    {
        var subject = await _subjectRepo.GetWithLevelsAndStudentsAsync(id)
            ?? throw new KeyNotFoundException("Matéria não encontrada.");
        if (subject.ProfessorId != professorId) throw new UnauthorizedAccessException("Acesso negado.");
        return _mapper.Map<SubjectResponseDto>(subject);
    }

    public async Task<SubjectResponseDto> CreateAsync(Guid professorId, CreateSubjectDto dto)
    {
        var subject = new Subject { Name = dto.Name, ProfessorId = professorId };
        await _subjectRepo.AddAsync(subject);
        return _mapper.Map<SubjectResponseDto>(subject);
    }

    public async Task<SubjectResponseDto> UpdateAsync(Guid id, Guid professorId, UpdateSubjectDto dto)
    {
        var subject = await _subjectRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Matéria não encontrada.");
        if (subject.ProfessorId != professorId) throw new UnauthorizedAccessException("Acesso negado.");
        subject.Name = dto.Name;
        await _subjectRepo.UpdateAsync(subject);
        return _mapper.Map<SubjectResponseDto>(subject);
    }

    public async Task DeleteAsync(Guid id, Guid professorId)
    {
        var subject = await _subjectRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Matéria não encontrada.");
        if (subject.ProfessorId != professorId) throw new UnauthorizedAccessException("Acesso negado.");
        await _subjectRepo.DeleteAsync(subject);
    }
}

public class LevelService : ILevelService
{
    private readonly ILevelRepository _levelRepo;
    private readonly ISubjectRepository _subjectRepo;
    private readonly IMapper _mapper;

    public LevelService(ILevelRepository levelRepo, ISubjectRepository subjectRepo, IMapper mapper)
    {
        _levelRepo = levelRepo;
        _subjectRepo = subjectRepo;
        _mapper = mapper;
    }

    public async Task<IEnumerable<LevelResponseDto>> GetBySubjectIdAsync(Guid subjectId, Guid professorId)
    {
        var subject = await _subjectRepo.Query()
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.Id == subjectId);
        if (subject == null)
            return Enumerable.Empty<LevelResponseDto>();
        if (subject.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        var levels = await _levelRepo.GetBySubjectIdAsync(subjectId);
        return _mapper.Map<IEnumerable<LevelResponseDto>>(levels);
    }

    public async Task<LevelResponseDto> CreateAsync(Guid professorId, CreateLevelDto dto)
    {
        var subject = await _subjectRepo.GetByIdAsync(dto.SubjectId)
            ?? throw new KeyNotFoundException("Matéria não encontrada.");
        if (subject.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        var level = new Level { SubjectId = dto.SubjectId, Name = dto.Name };
        await _levelRepo.AddAsync(level);
        return _mapper.Map<LevelResponseDto>(level);
    }

    public async Task<LevelResponseDto> UpdateAsync(Guid id, Guid professorId, UpdateLevelDto dto)
    {
        var level = await _levelRepo.Query()
            .Include(l => l.Subject)
            .FirstOrDefaultAsync(l => l.Id == id)
            ?? throw new KeyNotFoundException("Nível não encontrado.");

        if (level.Subject.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        level.Name = dto.Name;
        await _levelRepo.UpdateAsync(level);
        return _mapper.Map<LevelResponseDto>(level);
    }

    public async Task DeleteAsync(Guid id, Guid professorId)
    {
        var level = await _levelRepo.Query()
            .Include(l => l.Subject)
            .FirstOrDefaultAsync(l => l.Id == id)
            ?? throw new KeyNotFoundException("Nível não encontrado.");

        if (level.Subject.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        await _levelRepo.DeleteAsync(level);
    }
}

public class LessonService : ILessonService
{
    private readonly ILessonRepository _lessonRepo;
    private readonly IStudentRepository _studentRepo;
    private readonly IMapper _mapper;

    public LessonService(ILessonRepository lessonRepo, IStudentRepository studentRepo, IMapper mapper)
    {
        _lessonRepo = lessonRepo;
        _studentRepo = studentRepo;
        _mapper = mapper;
    }

    public async Task<IEnumerable<LessonResponseDto>> GetByProfessorIdAsync(Guid professorId)
    {
        var lessons = await _lessonRepo.GetByProfessorIdAsync(professorId);
        var filtered = lessons.Where(l =>
            (!l.Student.LastClassDate.HasValue || l.ScheduledAt.Date <= l.Student.LastClassDate.Value.Date)
            && (l.Student.IsActive || l.Status != "scheduled"));
        return _mapper.Map<IEnumerable<LessonResponseDto>>(filtered);
    }

    public async Task<IEnumerable<LessonResponseDto>> GetByStudentIdAsync(Guid studentId, Guid professorId)
    {
        var student = await _studentRepo.GetByIdAsync(studentId)
            ?? throw new KeyNotFoundException("Aluno não encontrado.");
        if (student.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        var lessons = await _lessonRepo.GetByStudentIdAsync(studentId);
        var filtered = lessons.Where(l =>
            !student.LastClassDate.HasValue || l.ScheduledAt.Date <= student.LastClassDate.Value.Date);
        return _mapper.Map<IEnumerable<LessonResponseDto>>(filtered);
    }

    public async Task<IEnumerable<LessonResponseDto>> GetByProfessorWeekAsync(Guid professorId, DateTime weekDate)
    {
        var monday = weekDate.Date.AddDays(-(int)weekDate.DayOfWeek + (int)DayOfWeek.Monday);
        if (weekDate.DayOfWeek == DayOfWeek.Sunday) monday = monday.AddDays(-7);
        var sunday = monday.AddDays(7);

        var lessons = await _lessonRepo.GetByProfessorIdAsync(professorId);
        var weekLessons = lessons
            .Where(l => l.ScheduledAt >= monday && l.ScheduledAt < sunday)
            .Where(l => (!l.Student.LastClassDate.HasValue || l.ScheduledAt.Date <= l.Student.LastClassDate.Value.Date)
                     && (l.Student.IsActive || l.Status != "scheduled"))
            .OrderBy(l => l.ScheduledAt);
        return _mapper.Map<IEnumerable<LessonResponseDto>>(weekLessons);
    }

    public async Task<LessonResponseDto> GetByIdAsync(Guid id, Guid professorId)
    {
        var lesson = await _lessonRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Aula não encontrada.");
        if (lesson.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");
        return _mapper.Map<LessonResponseDto>(lesson);
    }

    public async Task<LessonResponseDto> CreateAsync(Guid professorId, CreateLessonDto dto)
    {
        var student = await _studentRepo.GetByIdAsync(dto.StudentId)
            ?? throw new KeyNotFoundException("Aluno não encontrado.");
        if (student.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        var lesson = _mapper.Map<Lesson>(dto);
        lesson.ProfessorId = professorId;
        await _lessonRepo.AddAsync(lesson);
        return _mapper.Map<LessonResponseDto>(lesson);
    }

    public async Task<LessonResponseDto> UpdateAsync(Guid id, Guid professorId, UpdateLessonDto dto)
    {
        var lesson = await _lessonRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Aula não encontrada.");
        if (lesson.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        if (dto.Title != null) lesson.Title = dto.Title;
        if (dto.ScheduledAt.HasValue) lesson.ScheduledAt = dto.ScheduledAt.Value;
        if (dto.DurationMinutes.HasValue) lesson.DurationMinutes = dto.DurationMinutes.Value;
        if (dto.Status != null) lesson.Status = dto.Status;
        if (dto.Notes != null) lesson.Notes = dto.Notes;
        await _lessonRepo.UpdateAsync(lesson);
        return _mapper.Map<LessonResponseDto>(lesson);
    }

    public async Task DeleteAsync(Guid id, Guid professorId)
    {
        var lesson = await _lessonRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Aula não encontrada.");
        if (lesson.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");
        await _lessonRepo.DeleteAsync(lesson);
    }
}

public class DashboardService : IDashboardService
{
    private readonly IStudentRepository _studentRepo;
    private readonly ISubjectRepository _subjectRepo;
    private readonly ILessonRepository _lessonRepo;
    private readonly IMonthlyPaymentRepository _paymentRepo;
    private readonly IMapper _mapper;
    private readonly AuraDbContext _context;

    public DashboardService(IStudentRepository studentRepo, ISubjectRepository subjectRepo,
        ILessonRepository lessonRepo, IMonthlyPaymentRepository paymentRepo, IMapper mapper, AuraDbContext context)
    {
        _studentRepo = studentRepo;
        _subjectRepo = subjectRepo;
        _lessonRepo = lessonRepo;
        _paymentRepo = paymentRepo;
        _mapper = mapper;
        _context = context;
    }

    public async Task<DashboardDto> GetDashboardAsync(Guid professorId, int? month = null, int? year = null)
    {
        var now = DateTime.UtcNow;
        var selectedYear = year ?? now.Year;
        var selectedMonth = month ?? now.Month;

        var todayStart = now.Date;
        var todayEnd = todayStart.AddDays(1).AddTicks(-1);

        var students = await _studentRepo.Query()
            .AsNoTracking()
            .Where(s => s.ProfessorId == professorId && !s.IsDeleted)
            .ToListAsync();

        var totalStudents = students.Count;
        var activeCount = students.Count(s => s.IsActive);
        var archivedCount = students.Count(s => !s.IsActive);

        // Single indexed query for all professor lessons (eliminates 4 extra queries + N+1 loop)
        var rawProfessorLessons = await _lessonRepo.Query()
            .AsNoTracking()
            .Include(l => l.Student).ThenInclude(s => s.Subject)
            .Include(l => l.Student).ThenInclude(s => s.Level)
            .Where(l => l.ProfessorId == professorId && !l.IsDeleted)
            .ToListAsync();

        var allProfessorLessons = rawProfessorLessons
            .Where(l => (!l.Student.LastClassDate.HasValue || l.ScheduledAt.Date <= l.Student.LastClassDate.Value.Date)
                     && (l.Student.IsActive || l.Status != "scheduled"))
            .ToList();

        var todayLessons = allProfessorLessons
            .Where(l => l.ScheduledAt >= todayStart && l.ScheduledAt <= todayEnd && l.Status == "scheduled")
            .OrderBy(l => l.ScheduledAt)
            .ToList();

        Lesson? nextUpcomingLesson = null;
        if (todayLessons.Count == 0)
        {
            nextUpcomingLesson = allProfessorLessons
                .Where(l => l.ScheduledAt > todayEnd && l.Status == "scheduled")
                .OrderBy(l => l.ScheduledAt)
                .FirstOrDefault();
        }

        var pendingPreviousLessons = allProfessorLessons
            .Where(l => l.ScheduledAt < todayStart && l.Status == "scheduled")
            .OrderBy(l => l.ScheduledAt)
            .ToList();

        var pendingCorrections = await _context.StudentActivities
            .AsNoTracking()
            .Include(sa => sa.Student)
            .Include(sa => sa.TemplateActivity)
            .Where(sa => sa.Student.ProfessorId == professorId && sa.Status == "corrigir" && !sa.IsDeleted)
            .OrderByDescending(sa => sa.UpdatedAt ?? sa.CreatedAt)
            .Select(sa => new PendingCorrectionDto
            {
                StudentActivityId = sa.Id,
                StudentId = sa.StudentId,
                StudentName = sa.Student.Name,
                ActivityTitle = sa.TemplateActivity.Title,
                SubmittedAt = sa.UpdatedAt ?? sa.CreatedAt
            })
            .ToListAsync();

        var birthdayStudents = students
            .Where(s => s.BirthDate.HasValue && s.IsActive)
            .Select(s => {
                var rawDate = s.BirthDate!.Value;
                var adjustedDate = rawDate.Hour >= 21 ? rawDate.AddHours(4) : rawDate;
                return new {
                    StudentId = s.Id,
                    StudentName = s.Name,
                    AdjustedDate = adjustedDate
                };
            })
            .Where(x => x.AdjustedDate.Month == selectedMonth)
            .Select(x => new BirthdayStudentDto
            {
                StudentId = x.StudentId,
                StudentName = x.StudentName,
                BirthDay = x.AdjustedDate.Day,
                Age = CalculateAge(x.AdjustedDate, now)
            })
            .OrderBy(b => b.BirthDay)
            .ToList();

        var attendanceLessons = allProfessorLessons
            .Where(l => l.Status == "completed" || l.Status == "cancelled")
            .ToList();

        int completedLessons = attendanceLessons.Count(l => l.Status == "completed");
        int totalAttendanceLessons = attendanceLessons.Count;
        int averageAttendance = totalAttendanceLessons > 0 
            ? (int)Math.Round((double)completedLessons / totalAttendanceLessons * 100) 
            : 100;

        var startOfMonth = new DateTime(selectedYear, selectedMonth, 1, 0, 0, 0, DateTimeKind.Utc);
        var endOfMonth = startOfMonth.AddMonths(1);
        var monthlyLessons = allProfessorLessons
            .Where(l => l.ScheduledAt >= startOfMonth && l.ScheduledAt < endOfMonth)
            .ToList();

        var startOfYear = new DateTime(selectedYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var endOfYear = startOfYear.AddYears(1);
        var yearlyLessons = allProfessorLessons
            .Where(l => l.ScheduledAt >= startOfYear && l.ScheduledAt < endOfYear)
            .ToList();

        int monthlyLessonsCount = monthlyLessons.Count(l => l.Status == null || !l.Status.Equals("cancelled", StringComparison.OrdinalIgnoreCase));
        int yearlyLessonsCount = yearlyLessons.Count(l => l.Status == null || !l.Status.Equals("cancelled", StringComparison.OrdinalIgnoreCase));

        double monthlyWorkloadHours = Math.Round(monthlyLessons.Where(l => l.Status == null || !l.Status.Equals("cancelled", StringComparison.OrdinalIgnoreCase)).Sum(l => l.DurationMinutes) / 60.0, 1);
        double yearlyWorkloadHours = Math.Round(yearlyLessons.Where(l => l.Status == null || !l.Status.Equals("cancelled", StringComparison.OrdinalIgnoreCase)).Sum(l => l.DurationMinutes) / 60.0, 1);

        var statusGroups = new[] { "completed", "cancelled", "holiday", "scheduled" };
        var statusLabels = new Dictionary<string, string>
        {
            { "completed", "Aulas Dadas" },
            { "cancelled", "Faltas / Canceladas" },
            { "holiday", "Feriados / Recessos" },
            { "scheduled", "Agendadas" }
        };

        var monthlyTotalCount = monthlyLessons.Count;
        var monthlyLessonStatusStats = statusGroups.Select(status =>
        {
            var matching = monthlyLessons.Where(l => l.Status != null && l.Status.Equals(status, StringComparison.OrdinalIgnoreCase)).ToList();
            var count = matching.Count;
            var hours = Math.Round(matching.Sum(l => l.DurationMinutes) / 60.0, 1);
            var percentage = monthlyTotalCount > 0 ? Math.Round((double)count / monthlyTotalCount * 100.0, 1) : 0;
            return new LessonStatusStatDto
            {
                Status = status,
                Label = statusLabels.GetValueOrDefault(status, status),
                Count = count,
                Hours = hours,
                Percentage = percentage
            };
        }).ToList();

        var yearlyTotalCount = yearlyLessons.Count;
        var yearlyLessonStatusStats = statusGroups.Select(status =>
        {
            var matching = yearlyLessons.Where(l => l.Status != null && l.Status.Equals(status, StringComparison.OrdinalIgnoreCase)).ToList();
            var count = matching.Count;
            var hours = Math.Round(matching.Sum(l => l.DurationMinutes) / 60.0, 1);
            var percentage = yearlyTotalCount > 0 ? Math.Round((double)count / yearlyTotalCount * 100.0, 1) : 0;
            return new LessonStatusStatDto
            {
                Status = status,
                Label = statusLabels.GetValueOrDefault(status, status),
                Count = count,
                Hours = hours,
                Percentage = percentage
            };
        }).ToList();

        var subjects = await _subjectRepo.GetByProfessorIdAsync(professorId);

        var monthlyPastLessons = monthlyLessons
            .Where(l => l.Status != null && (
                l.Status.Equals("completed", StringComparison.OrdinalIgnoreCase) ||
                l.Status.Equals("cancelled", StringComparison.OrdinalIgnoreCase) ||
                l.Status.Equals("holiday", StringComparison.OrdinalIgnoreCase) ||
                (l.Status.Equals("scheduled", StringComparison.OrdinalIgnoreCase) && l.ScheduledAt <= now)
            ))
            .ToList();
        int monthlyCompletedCount = monthlyPastLessons.Count(l => l.Status!.Equals("completed", StringComparison.OrdinalIgnoreCase));
        int monthlyTotalPastCount = monthlyPastLessons.Count;
        int monthlyEffectivenessRate = monthlyTotalPastCount > 0 ? (int)Math.Round((double)monthlyCompletedCount / monthlyTotalPastCount * 100) : 100;

        var yearlyPastLessons = yearlyLessons
            .Where(l => l.Status != null && (
                l.Status.Equals("completed", StringComparison.OrdinalIgnoreCase) ||
                l.Status.Equals("cancelled", StringComparison.OrdinalIgnoreCase) ||
                l.Status.Equals("holiday", StringComparison.OrdinalIgnoreCase) ||
                (l.Status.Equals("scheduled", StringComparison.OrdinalIgnoreCase) && l.ScheduledAt <= now)
            ))
            .ToList();
        int yearlyCompletedCount = yearlyPastLessons.Count(l => l.Status!.Equals("completed", StringComparison.OrdinalIgnoreCase));
        int yearlyTotalPastCount = yearlyPastLessons.Count;
        int yearlyEffectivenessRate = yearlyTotalPastCount > 0 ? (int)Math.Round((double)yearlyCompletedCount / yearlyTotalPastCount * 100) : 100;

        var completedActivities = await _context.StudentActivities
            .Include(sa => sa.Student)
            .Include(sa => sa.TemplateActivity)
            .Where(sa => sa.Student.ProfessorId == professorId && sa.Status == "completed" && sa.CompletedAt != null && !sa.IsDeleted && sa.CompletedAt >= startOfMonth && sa.CompletedAt < endOfMonth)
            .OrderByDescending(sa => sa.CompletedAt)
            .Select(sa => new CompletedActivityDto
            {
                StudentActivityId = sa.Id,
                StudentId = sa.StudentId,
                StudentName = sa.Student.Name,
                ActivityTitle = sa.TemplateActivity.Title,
                CompletedAt = sa.CompletedAt,
                Grade = sa.Grade,
                MaxGrade = sa.MaxGrade
            })
            .ToListAsync();

        var paidStudentIdsThisMonth = await _context.MonthlyPayments
            .Where(p => p.Student.ProfessorId == professorId && p.Month == selectedMonth && p.Year == selectedYear && p.IsPaid && !p.IsDeleted)
            .Select(p => p.StudentId)
            .Distinct()
            .ToListAsync();

        var paidSet = paidStudentIdsThisMonth.ToHashSet();

        var pendingPayments = new List<PendingPaymentDto>();
        foreach (var student in students.Where(s => s.IsActive))
        {
            var startDate = student.FirstClassDate ?? student.CreatedAt;
            if (selectedYear < startDate.Year || (selectedYear == startDate.Year && selectedMonth < startDate.Month))
                continue;

            if (!paidSet.Contains(student.Id) && student.MonthlyPrice > 0)
            {
                pendingPayments.Add(new PendingPaymentDto
                {
                    StudentId = student.Id,
                    StudentName = student.Name,
                    MonthlyPrice = student.MonthlyPrice
                });
            }
        }

        var todayLessonsDtos = _mapper.Map<List<LessonResponseDto>>(todayLessons);
        foreach (var dto in todayLessonsDtos)
        {
            var prevLesson = allProfessorLessons
                .Where(p => p.StudentId == dto.StudentId && p.ScheduledAt < dto.ScheduledAt && p.Id != dto.Id && p.Status != "cancelled")
                .OrderByDescending(p => p.ScheduledAt)
                .FirstOrDefault();

            if (prevLesson != null)
            {
                dto.LastLessonDate = prevLesson.ScheduledAt;
                dto.LastLessonTitle = prevLesson.Title;
                dto.LastLessonNotes = prevLesson.Notes;
            }
            else
            {
                var student = students.FirstOrDefault(s => s.Id == dto.StudentId);
                if (student?.LastClassDate.HasValue == true && student.LastClassDate.Value < dto.ScheduledAt)
                {
                    dto.LastLessonDate = student.LastClassDate;
                }
            }
        }

        LessonResponseDto? nextUpcomingLessonDto = null;
        if (nextUpcomingLesson != null)
        {
            nextUpcomingLessonDto = _mapper.Map<LessonResponseDto>(nextUpcomingLesson);
            var prevLesson = allProfessorLessons
                .Where(p => p.StudentId == nextUpcomingLessonDto.StudentId && p.ScheduledAt < nextUpcomingLessonDto.ScheduledAt && p.Id != nextUpcomingLessonDto.Id && p.Status != "cancelled")
                .OrderByDescending(p => p.ScheduledAt)
                .FirstOrDefault();

            if (prevLesson != null)
            {
                nextUpcomingLessonDto.LastLessonDate = prevLesson.ScheduledAt;
                nextUpcomingLessonDto.LastLessonTitle = prevLesson.Title;
                nextUpcomingLessonDto.LastLessonNotes = prevLesson.Notes;
            }
            else
            {
                var student = students.FirstOrDefault(s => s.Id == nextUpcomingLessonDto.StudentId);
                if (student?.LastClassDate.HasValue == true && student.LastClassDate.Value < nextUpcomingLessonDto.ScheduledAt)
                {
                    nextUpcomingLessonDto.LastLessonDate = student.LastClassDate;
                }
            }
        }

        return new DashboardDto
        {
            TotalStudents = totalStudents,
            ActiveStudentsCount = activeCount,
            ArchivedStudentsCount = archivedCount,
            MonthlyLessonsCount = monthlyLessonsCount,
            YearlyLessonsCount = yearlyLessonsCount,
            MonthlyWorkloadHours = monthlyWorkloadHours,
            YearlyWorkloadHours = yearlyWorkloadHours,
            TodayLessons = todayLessonsDtos,
            NextUpcomingLesson = nextUpcomingLessonDto,
            BirthdayStudents = birthdayStudents,
            AverageAttendanceRate = averageAttendance,
            SubjectStats = _mapper.Map<List<SubjectStatDto>>(subjects),
            MonthlyLessonStatusStats = monthlyLessonStatusStats,
            YearlyLessonStatusStats = yearlyLessonStatusStats,
            MonthlyEffectivenessRate = monthlyEffectivenessRate,
            YearlyEffectivenessRate = yearlyEffectivenessRate,
            PendingPreviousLessons = _mapper.Map<List<LessonResponseDto>>(pendingPreviousLessons),
            PendingCorrections = pendingCorrections,
            CompletedActivities = completedActivities,
            PendingPayments = pendingPayments
        };
    }

    private static int CalculateAge(DateTime birthDate, DateTime today)
    {
        var age = today.Year - birthDate.Year;
        if (birthDate.Date > today.Date.AddYears(-age)) age--;
        return age;
    }
}

public class PaymentService : IPaymentService
{
    private readonly IMonthlyPaymentRepository _paymentRepo;
    private readonly IStudentRepository _studentRepo;
    private readonly IMapper _mapper;

    public PaymentService(IMonthlyPaymentRepository paymentRepo, IStudentRepository studentRepo, IMapper mapper)
    {
        _paymentRepo = paymentRepo;
        _studentRepo = studentRepo;
        _mapper = mapper;
    }

    public async Task<IEnumerable<PaymentResponseDto>> GetByStudentIdAsync(Guid studentId, Guid professorId)
    {
        var student = await _studentRepo.GetByIdAsync(studentId)
            ?? throw new KeyNotFoundException("Aluno não encontrado.");
        if (student.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        var payments = await _paymentRepo.GetByStudentIdAsync(studentId);
        return _mapper.Map<IEnumerable<PaymentResponseDto>>(payments);
    }

    public async Task<PaymentResponseDto> CreateAsync(Guid professorId, CreatePaymentDto dto)
    {
        var student = await _studentRepo.GetByIdAsync(dto.StudentId)
            ?? throw new KeyNotFoundException("Aluno não encontrado.");
        if (student.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        var payment = _mapper.Map<MonthlyPayment>(dto);
        await _paymentRepo.AddAsync(payment);
        return _mapper.Map<PaymentResponseDto>(payment);
    }

    public async Task<PaymentResponseDto> UpdateAsync(Guid id, Guid professorId, UpdatePaymentDto dto)
    {
        var payment = await _paymentRepo.Query()
            .Include(p => p.Student)
            .FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new KeyNotFoundException("Pagamento não encontrado.");

        if (payment.Student.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        if (dto.IsPaid.HasValue)
        {
            payment.IsPaid = dto.IsPaid.Value;
            if (dto.IsPaid.Value) payment.PaidAt = DateTime.UtcNow;
        }
        if (dto.Amount.HasValue) payment.Amount = dto.Amount.Value;
        if (dto.PaidAt.HasValue) payment.PaidAt = dto.PaidAt;
        await _paymentRepo.UpdateAsync(payment);
        return _mapper.Map<PaymentResponseDto>(payment);
    }

    public async Task DeleteAsync(Guid id, Guid professorId)
    {
        var payment = await _paymentRepo.Query()
            .Include(p => p.Student)
            .FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new KeyNotFoundException("Pagamento não encontrado.");

        if (payment.Student.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        await _paymentRepo.DeleteAsync(payment);
    }
}

public class ExamService : IExamService
{
    private readonly IExamRepository _examRepo;
    private readonly IStudentRepository _studentRepo;
    private readonly IMapper _mapper;

    public ExamService(IExamRepository examRepo, IStudentRepository studentRepo, IMapper mapper)
    {
        _examRepo = examRepo;
        _studentRepo = studentRepo;
        _mapper = mapper;
    }

    public async Task<IEnumerable<ExamResponseDto>> GetByStudentIdAsync(Guid studentId, Guid professorId)
    {
        var student = await _studentRepo.GetByIdAsync(studentId)
            ?? throw new KeyNotFoundException("Aluno não encontrado.");
        if (student.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        var exams = await _examRepo.GetByStudentIdAsync(studentId);
        return _mapper.Map<IEnumerable<ExamResponseDto>>(exams);
    }

    public async Task<ExamResponseDto> CreateAsync(Guid professorId, CreateExamDto dto)
    {
        var student = await _studentRepo.GetByIdAsync(dto.StudentId)
            ?? throw new KeyNotFoundException("Aluno não encontrado.");
        if (student.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        var exam = _mapper.Map<Exam>(dto);
        await _examRepo.AddAsync(exam);
        return _mapper.Map<ExamResponseDto>(exam);
    }

    public async Task<ExamResponseDto> UpdateAsync(Guid id, Guid professorId, UpdateExamDto dto)
    {
        var exam = await _examRepo.Query()
            .Include(e => e.Student)
            .FirstOrDefaultAsync(e => e.Id == id)
            ?? throw new KeyNotFoundException("Prova não encontrada.");

        if (exam.Student.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        if (dto.Title != null) exam.Title = dto.Title;
        if (dto.ScheduledAt.HasValue) exam.ScheduledAt = dto.ScheduledAt.Value;
        exam.Notes = dto.Notes;
        exam.Grade = dto.Grade;
        if (dto.MaxGrade.HasValue) exam.MaxGrade = dto.MaxGrade.Value;
        await _examRepo.UpdateAsync(exam);
        return _mapper.Map<ExamResponseDto>(exam);
    }

    public async Task DeleteAsync(Guid id, Guid professorId)
    {
        var exam = await _examRepo.Query()
            .Include(e => e.Student)
            .FirstOrDefaultAsync(e => e.Id == id)
            ?? throw new KeyNotFoundException("Prova não encontrada.");

        if (exam.Student.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        await _examRepo.DeleteAsync(exam);
    }
}

public class ExerciseService : IExerciseService
{
    private readonly IExerciseRepository _exerciseRepo;
    private readonly IStudentRepository _studentRepo;
    private readonly IMapper _mapper;

    public ExerciseService(IExerciseRepository exerciseRepo, IStudentRepository studentRepo, IMapper mapper)
    {
        _exerciseRepo = exerciseRepo;
        _studentRepo = studentRepo;
        _mapper = mapper;
    }

    public async Task<IEnumerable<ExerciseResponseDto>> GetByStudentIdAsync(Guid studentId, Guid professorId)
    {
        var student = await _studentRepo.GetByIdAsync(studentId)
            ?? throw new KeyNotFoundException("Aluno não encontrado.");
        if (student.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        var exercises = await _exerciseRepo.GetByStudentIdAsync(studentId);
        return _mapper.Map<IEnumerable<ExerciseResponseDto>>(exercises);
    }

    public async Task<ExerciseResponseDto> CreateAsync(Guid professorId, CreateExerciseDto dto)
    {
        var student = await _studentRepo.GetByIdAsync(dto.StudentId)
            ?? throw new KeyNotFoundException("Aluno não encontrado.");
        if (student.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        var exercise = _mapper.Map<Exercise>(dto);
        await _exerciseRepo.AddAsync(exercise);
        return _mapper.Map<ExerciseResponseDto>(exercise);
    }

    public async Task<ExerciseResponseDto> UpdateAsync(Guid id, Guid professorId, UpdateExerciseDto dto)
    {
        var exercise = await _exerciseRepo.Query()
            .Include(e => e.Student)
            .FirstOrDefaultAsync(e => e.Id == id)
            ?? throw new KeyNotFoundException("Exercício não encontrado.");

        if (exercise.Student.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        if (dto.Title != null) exercise.Title = dto.Title;
        if (dto.ScheduledAt.HasValue) exercise.ScheduledAt = dto.ScheduledAt.Value;
        exercise.Notes = dto.Notes;
        exercise.Grade = dto.Grade;
        if (dto.MaxGrade.HasValue) exercise.MaxGrade = dto.MaxGrade.Value;
        await _exerciseRepo.UpdateAsync(exercise);
        return _mapper.Map<ExerciseResponseDto>(exercise);
    }

    public async Task DeleteAsync(Guid id, Guid professorId)
    {
        var exercise = await _exerciseRepo.Query()
            .Include(e => e.Student)
            .FirstOrDefaultAsync(e => e.Id == id)
            ?? throw new KeyNotFoundException("Exercício não encontrado.");

        if (exercise.Student.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        await _exerciseRepo.DeleteAsync(exercise);
    }
}

public class ScheduleService : IScheduleService
{
    private readonly IScheduleRepository _scheduleRepo;
    private readonly ILessonRepository _lessonRepo;
    private readonly IHolidayRepository _holidayRepo;
    private readonly IStudentRepository _studentRepo;
    private readonly IMapper _mapper;

    public ScheduleService(IScheduleRepository scheduleRepo, ILessonRepository lessonRepo,
        IHolidayRepository holidayRepo, IStudentRepository studentRepo, IMapper mapper)
    {
        _scheduleRepo = scheduleRepo;
        _lessonRepo = lessonRepo;
        _holidayRepo = holidayRepo;
        _studentRepo = studentRepo;
        _mapper = mapper;
    }

    public async Task<IEnumerable<ScheduleResponseDto>> GetByProfessorIdAsync(Guid professorId)
    {
        var schedules = await _scheduleRepo.GetByProfessorIdAsync(professorId);
        var activeSchedules = schedules.Where(s => s.Student.IsActive);
        return _mapper.Map<IEnumerable<ScheduleResponseDto>>(activeSchedules);
    }

    public async Task<IEnumerable<ScheduleResponseDto>> GetByStudentIdAsync(Guid studentId, Guid professorId)
    {
        var student = await _studentRepo.GetByIdAsync(studentId)
            ?? throw new KeyNotFoundException("Aluno não encontrado.");
        if (student.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        var schedules = await _scheduleRepo.GetByStudentIdAsync(studentId);
        return _mapper.Map<IEnumerable<ScheduleResponseDto>>(schedules);
    }

    private static string NormalizeFrequency(string? frequency)
    {
        var f = (frequency ?? "weekly").Trim().ToLowerInvariant();
        return f is "biweekly" or "monthly" ? f : "weekly";
    }

    private static bool MatchesScheduleFrequency(DateTime date, Schedule schedule)
    {
        if ((int)date.DayOfWeek != schedule.DayOfWeek)
            return false;

        if (date.Date < schedule.ValidFrom.Date)
            return false;

        if (schedule.ValidUntil.HasValue && date.Date > schedule.ValidUntil.Value.Date)
            return false;

        var freq = NormalizeFrequency(schedule.Frequency);
        if (freq == "weekly")
            return true;

        var daysOffset = (schedule.DayOfWeek - (int)schedule.ValidFrom.Date.DayOfWeek + 7) % 7;
        var firstOccurrence = schedule.ValidFrom.Date.AddDays(daysOffset);
        if (date.Date < firstOccurrence)
            return false;

        if (freq == "biweekly")
        {
            var diffDays = (int)Math.Round((date.Date - firstOccurrence).TotalDays);
            return diffDays >= 0 && (diffDays % 14 == 0);
        }

        if (freq == "monthly")
        {
            var targetWeekIndex = (firstOccurrence.Day - 1) / 7;
            var currentWeekIndex = (date.Day - 1) / 7;
            if (targetWeekIndex >= 4 && date.AddDays(7).Month != date.Month)
            {
                return currentWeekIndex == 3 || currentWeekIndex == 4;
            }
            return currentWeekIndex == targetWeekIndex;
        }

        return true;
    }

    public async Task<ScheduleResponseDto> CreateAsync(Guid professorId, CreateScheduleDto dto)
    {
        var student = await _studentRepo.GetByIdAsync(dto.StudentId)
            ?? throw new KeyNotFoundException("Aluno não encontrado.");
        if (student.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        var schedule = new Schedule
        {
            ProfessorId = professorId,
            StudentId = dto.StudentId,
            DayOfWeek = dto.DayOfWeek,
            StartTime = TimeSpan.Parse(dto.StartTime),
            EndTime = TimeSpan.Parse(dto.EndTime),
            Frequency = NormalizeFrequency(dto.Frequency),
            IsRecurring = dto.IsRecurring,
            ValidFrom = dto.ValidFrom,
            ValidUntil = dto.ValidUntil
        };
        await _scheduleRepo.AddAsync(schedule);

        var holidays = await _holidayRepo.GetByProfessorIdAsync(professorId);
        var holidayDates = new HashSet<DateTime>();
        foreach (var h in holidays)
        {
            if (h.Date.HasValue) holidayDates.Add(h.Date.Value.Date);
            if (h.IsVacationPeriod && h.VacationStart.HasValue && h.VacationEnd.HasValue)
            {
                for (var d = h.VacationStart.Value.Date; d <= h.VacationEnd.Value.Date; d = d.AddDays(1))
                    holidayDates.Add(d);
            }
        }

        var baseDate = student.FirstClassDate.HasValue
            ? student.FirstClassDate.Value.Date
            : schedule.ValidFrom.Date;

        var endOfYear = schedule.ValidUntil.HasValue
            ? schedule.ValidUntil.Value.Date
            : new DateTime(baseDate.Year, 12, 31);

        if ((endOfYear - baseDate).TotalDays < 90)
        {
            endOfYear = new DateTime(baseDate.Year + 1, 12, 31);
        }

        // Proteção contra loop excessivo (máx. 2 anos de geração automática)
        if ((endOfYear - baseDate).TotalDays > 730)
        {
            endOfYear = baseDate.AddDays(730);
        }

        for (var date = baseDate; date <= endOfYear; date = date.AddDays(1))
        {
            if (holidayDates.Contains(date.Date)) continue;

            if (MatchesScheduleFrequency(date, schedule))
            {
                var lessonDate = date.Add(schedule.StartTime);

                var exists = await _lessonRepo.Query().AnyAsync(l => l.StudentId == dto.StudentId && l.ScheduledAt == lessonDate && !l.IsDeleted);
                if (exists) continue;

                var lesson = new Lesson
                {
                    ProfessorId = professorId,
                    StudentId = dto.StudentId,
                    ScheduledAt = lessonDate,
                    DurationMinutes = (int)(schedule.EndTime - schedule.StartTime).TotalMinutes,
                    Status = "scheduled"
                };
                await _lessonRepo.AddAsync(lesson);
            }
        }

        return _mapper.Map<ScheduleResponseDto>(schedule);
    }

    public async Task<ScheduleResponseDto> UpdateAsync(Guid id, Guid professorId, UpdateScheduleDto dto)
    {
        var schedule = await _scheduleRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Agendamento não encontrado.");
        if (schedule.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        if (dto.StudentId.HasValue)
        {
            var targetStudent = await _studentRepo.GetByIdAsync(dto.StudentId.Value)
                ?? throw new KeyNotFoundException("Aluno não encontrado.");
            if (targetStudent.ProfessorId != professorId)
                throw new UnauthorizedAccessException("Acesso negado.");
            schedule.StudentId = dto.StudentId.Value;
        }
        if (dto.DayOfWeek.HasValue) schedule.DayOfWeek = dto.DayOfWeek.Value;
        if (dto.StartTime != null) schedule.StartTime = TimeSpan.Parse(dto.StartTime);
        if (dto.EndTime != null) schedule.EndTime = TimeSpan.Parse(dto.EndTime);
        if (dto.Frequency != null) schedule.Frequency = NormalizeFrequency(dto.Frequency);
        if (dto.IsRecurring.HasValue) schedule.IsRecurring = dto.IsRecurring.Value;
        if (dto.ValidFrom.HasValue) schedule.ValidFrom = dto.ValidFrom.Value;
        schedule.ValidUntil = dto.ValidUntil;

        await _scheduleRepo.UpdateAsync(schedule);

        var today = DateTime.Today;
        var futureLessons = await _lessonRepo.Query()
            .Where(l => l.StudentId == schedule.StudentId && l.ScheduledAt >= today && l.Status == "scheduled" && !l.IsDeleted)
            .ToListAsync();

        foreach (var lesson in futureLessons)
        {
            await _lessonRepo.DeleteAsync(lesson);
        }

        var student = await _studentRepo.GetByIdAsync(schedule.StudentId);

        var holidays = await _holidayRepo.GetByProfessorIdAsync(schedule.ProfessorId);
        var holidayDates = new HashSet<DateTime>();
        foreach (var h in holidays)
        {
            if (h.Date.HasValue) holidayDates.Add(h.Date.Value.Date);
            if (h.IsVacationPeriod && h.VacationStart.HasValue && h.VacationEnd.HasValue)
            {
                for (var d = h.VacationStart.Value.Date; d <= h.VacationEnd.Value.Date; d = d.AddDays(1))
                    holidayDates.Add(d);
            }
        }

        var studentSchedules = await _scheduleRepo.GetByStudentIdAsync(schedule.StudentId);
        foreach (var activeSched in studentSchedules.Where(s => s.IsRecurring))
        {
            var updateBaseDate = (student != null && student.FirstClassDate.HasValue)
                ? (student.FirstClassDate.Value.Date > today ? student.FirstClassDate.Value.Date : today)
                : (activeSched.ValidFrom.Date > today ? activeSched.ValidFrom.Date : today);

            var updateEndOfYear = activeSched.ValidUntil.HasValue
                ? activeSched.ValidUntil.Value.Date
                : new DateTime(updateBaseDate.Year, 12, 31);

            if ((updateEndOfYear - updateBaseDate).TotalDays < 90)
            {
                updateEndOfYear = new DateTime(updateBaseDate.Year + 1, 12, 31);
            }

            if ((updateEndOfYear - updateBaseDate).TotalDays > 730)
            {
                updateEndOfYear = updateBaseDate.AddDays(730);
            }

            for (var date = updateBaseDate; date <= updateEndOfYear; date = date.AddDays(1))
            {
                if (holidayDates.Contains(date.Date)) continue;

                if (MatchesScheduleFrequency(date, activeSched))
                {
                    var lessonDate = date.Add(activeSched.StartTime);

                    var exists = await _lessonRepo.Query().AnyAsync(l => l.StudentId == activeSched.StudentId && l.ScheduledAt == lessonDate && !l.IsDeleted);
                    if (exists) continue;

                    var lesson = new Lesson
                    {
                        ProfessorId = activeSched.ProfessorId,
                        StudentId = activeSched.StudentId,
                        ScheduledAt = lessonDate,
                        DurationMinutes = (int)(activeSched.EndTime - activeSched.StartTime).TotalMinutes,
                        Status = "scheduled"
                    };
                    await _lessonRepo.AddAsync(lesson);
                }
            }
        }

        return _mapper.Map<ScheduleResponseDto>(schedule);
    }

    public async Task DeleteAsync(Guid id, Guid professorId)
    {
        var schedule = await _scheduleRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Agendamento não encontrado.");
        if (schedule.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");
        await _scheduleRepo.DeleteAsync(schedule);
    }

    public async Task<int> ReplicateWeekAsync(Guid professorId, Application.DTOs.Schedule.ReplicateWeekDto dto)
    {
        if (dto.EndDate < dto.StartDate)
            throw new ArgumentException("A data final deve ser maior ou igual à data inicial.");

        if ((dto.EndDate.Date - dto.StartDate.Date).TotalDays > 366)
            throw new ArgumentException("O intervalo máximo para replicação de agenda é de 1 ano (366 dias).");

        var schedules = await _scheduleRepo.GetByProfessorIdAsync(professorId);
        var holidays = await _holidayRepo.GetByProfessorIdAsync(professorId);
        var holidayDates = new HashSet<DateTime>();

        foreach (var h in holidays)
        {
            if (h.Date.HasValue) holidayDates.Add(h.Date.Value.Date);
            if (h.IsVacationPeriod && h.VacationStart.HasValue && h.VacationEnd.HasValue)
            {
                for (var d = h.VacationStart.Value.Date; d <= h.VacationEnd.Value.Date; d = d.AddDays(1))
                    holidayDates.Add(d);
            }
        }

        int count = 0;
        for (var date = dto.StartDate.Date; date <= dto.EndDate.Date; date = date.AddDays(1))
        {
            if (holidayDates.Contains(date)) continue;
            var dayOfWeek = (int)date.DayOfWeek;

            foreach (var schedule in schedules.Where(s => s.DayOfWeek == dayOfWeek && s.IsRecurring && s.Student.IsActive))
            {
                if (!MatchesScheduleFrequency(date, schedule))
                    continue;

                var lessonDate = date.Add(schedule.StartTime);

                if (lessonDate <= DateTime.UtcNow)
                {
                    continue;
                }

                var lesson = new Lesson
                {
                    ProfessorId = professorId,
                    StudentId = schedule.StudentId,
                    ScheduledAt = lessonDate,
                    DurationMinutes = (int)(schedule.EndTime - schedule.StartTime).TotalMinutes,
                    Status = "scheduled"
                };
                await _lessonRepo.AddAsync(lesson);
                count++;
            }
        }
        return count;
    }

    public async Task EndScheduleAsync(Guid id, Guid professorId, DateTime endDate)
    {
        var schedule = await _scheduleRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Agendamento não encontrado.");
        if (schedule.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        schedule.ValidUntil = endDate.Date;
        await _scheduleRepo.UpdateAsync(schedule);

        var lessons = await _lessonRepo.Query()
            .Where(l => l.StudentId == schedule.StudentId
                     && l.ScheduledAt >= endDate.Date
                     && l.Status == "scheduled"
                     && !l.IsDeleted)
            .ToListAsync();

        var lessonsToDelete = lessons
            .Where(l => (int)l.ScheduledAt.DayOfWeek == schedule.DayOfWeek
                     && Math.Abs((l.ScheduledAt.TimeOfDay - schedule.StartTime).TotalMinutes) < 5)
            .ToList();

        foreach (var lesson in lessonsToDelete)
        {
            await _lessonRepo.DeleteAsync(lesson);
        }
    }
}

public class HolidayService : IHolidayService
{
    private readonly IHolidayRepository _holidayRepo;
    private readonly IMapper _mapper;

    public HolidayService(IHolidayRepository holidayRepo, IMapper mapper)
    {
        _holidayRepo = holidayRepo;
        _mapper = mapper;
    }

    public async Task<IEnumerable<HolidayResponseDto>> GetByProfessorIdAsync(Guid professorId)
    {
        var holidays = await _holidayRepo.GetByProfessorIdAsync(professorId);
        return _mapper.Map<IEnumerable<HolidayResponseDto>>(holidays);
    }

    public async Task<HolidayResponseDto> CreateAsync(Guid professorId, CreateHolidayDto dto)
    {
        var holiday = _mapper.Map<Holiday>(dto);
        holiday.ProfessorId = professorId;
        await _holidayRepo.AddAsync(holiday);
        return _mapper.Map<HolidayResponseDto>(holiday);
    }

    public async Task<HolidayResponseDto> UpdateAsync(Guid id, Guid professorId, UpdateHolidayDto dto)
    {
        var holiday = await _holidayRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Feriado não encontrado.");
        if (holiday.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        if (dto.Name != null) holiday.Name = dto.Name;
        if (dto.Date.HasValue) holiday.Date = dto.Date;
        if (dto.IsVacationPeriod.HasValue) holiday.IsVacationPeriod = dto.IsVacationPeriod.Value;
        if (dto.VacationStart.HasValue) holiday.VacationStart = dto.VacationStart;
        if (dto.VacationEnd.HasValue) holiday.VacationEnd = dto.VacationEnd;
        await _holidayRepo.UpdateAsync(holiday);
        return _mapper.Map<HolidayResponseDto>(holiday);
    }

    public async Task DeleteAsync(Guid id, Guid professorId)
    {
        var holiday = await _holidayRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Feriado não encontrado.");
        if (holiday.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");
        await _holidayRepo.DeleteAsync(holiday);
    }
}

public class FileStorageService : IFileStorageService
{
    private readonly string _basePath;
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".gif"
    };

    public FileStorageService(string basePath)
    {
        _basePath = Path.GetFullPath(basePath);
    }

    public async Task<string> SaveFileAsync(Stream stream, string fileName, string folder)
    {
        var ext = Path.GetExtension(fileName)?.ToLowerInvariant() ?? string.Empty;
        if (!AllowedExtensions.Contains(ext))
            throw new ArgumentException("Formato de arquivo não permitido. Envie apenas imagens JPG, PNG, WEBP ou GIF.");

        using var memoryStream = new MemoryStream();
        await stream.CopyToAsync(memoryStream);

        if (memoryStream.Length == 0 || memoryStream.Length > 5 * 1024 * 1024)
            throw new ArgumentException("O arquivo de imagem deve ter no máximo 5 MB.");

        var header = memoryStream.GetBuffer();
        if (!IsValidImageSignature(header, (int)Math.Min(memoryStream.Length, 16)))
            throw new ArgumentException("O conteúdo do arquivo enviado não corresponde a uma imagem válida.");

        var safeFolder = Path.GetFileName(folder);
        var uniqueName = $"{Guid.NewGuid()}{ext}";
        var folderPath = Path.Combine(_basePath, "uploads", safeFolder);
        Directory.CreateDirectory(folderPath);
        var filePath = Path.Combine(folderPath, uniqueName);

        memoryStream.Position = 0;
        using var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None);
        await memoryStream.CopyToAsync(fileStream);

        return $"/uploads/{safeFolder}/{uniqueName}";
    }

    public void DeleteFile(string relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath)) return;
        var sanitizedRelative = relativePath.TrimStart('/', '\\').Replace('/', Path.DirectorySeparatorChar);
        var fullPath = Path.GetFullPath(Path.Combine(_basePath, sanitizedRelative));

        // Proteção contra Path Traversal: garante que o caminho final está dentro de _basePath/uploads
        var uploadsRoot = Path.GetFullPath(Path.Combine(_basePath, "uploads"));
        if (!fullPath.StartsWith(uploadsRoot, StringComparison.OrdinalIgnoreCase))
            return;

        if (File.Exists(fullPath))
            File.Delete(fullPath);
    }

    private static bool IsValidImageSignature(byte[] bytes, int length)
    {
        if (length < 4) return false;

        // JPEG: FF D8 FF
        if (bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF)
            return true;

        // PNG: 89 50 4E 47
        if (bytes[0] == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47)
            return true;

        // GIF: 47 49 46 38 ("GIF8")
        if (bytes[0] == 0x47 && bytes[1] == 0x49 && bytes[2] == 0x46 && bytes[3] == 0x38)
            return true;

        // WEBP: "RIFF" .... "WEBP"
        if (length >= 12 &&
            bytes[0] == 0x52 && bytes[1] == 0x49 && bytes[2] == 0x46 && bytes[3] == 0x46 &&
            bytes[8] == 0x57 && bytes[9] == 0x45 && bytes[10] == 0x42 && bytes[11] == 0x50)
            return true;

        return false;
    }
}

public class FinanceService : IFinanceService
{
    private readonly IStudentRepository _studentRepo;
    private readonly IMonthlyPaymentRepository _paymentRepo;
    private readonly IMapper _mapper;
    private readonly AuraDbContext _context;

    public FinanceService(IStudentRepository studentRepo, IMonthlyPaymentRepository paymentRepo, IMapper mapper, AuraDbContext context)
    {
        _context = context;
        _studentRepo = studentRepo;
        _paymentRepo = paymentRepo;
        _mapper = mapper;
    }

    public async Task<FinanceDto> GetFinanceDataAsync(Guid professorId, int? month, int? year)
    {
        var now = DateTime.UtcNow;
        int targetMonth = month ?? now.Month;
        int targetYear = year ?? now.Year;

        var payments = await _paymentRepo.Query()
            .Include(p => p.Student)
            .ThenInclude(s => s.Subject)
            .Where(p => p.Student.ProfessorId == professorId && p.IsPaid && !p.IsDeleted)
            .ToListAsync();

        var totalRevenue = payments.Sum(p => p.Amount);
        var manualEntries = new List<ManualFinanceEntry>();
        try
        {
            await EnsureManualTableAsync();
            manualEntries = await _context.ManualFinanceEntries
                .Where(m => m.ProfessorId == professorId && !m.IsDeleted)
                .OrderByDescending(m => m.Date)
                .ThenByDescending(m => m.CreatedAt)
                .ToListAsync();
        }
        catch
        {
            manualEntries = new List<ManualFinanceEntry>();
        }

        totalRevenue += manualEntries.Sum(m => m.Amount);
        var monthlyManualSum = manualEntries.Where(m => m.Month == targetMonth && m.Year == targetYear).Sum(m => m.Amount);
        var yearlyManualSum = manualEntries.Where(m => m.Year == targetYear).Sum(m => m.Amount);
        var monthlyRevenue = payments.Where(p => p.Month == targetMonth && p.Year == targetYear).Sum(p => p.Amount) + monthlyManualSum;
        var yearlyRevenue = payments.Where(p => p.Year == targetYear).Sum(p => p.Amount) + yearlyManualSum;

        var combinedMonthlyItems = payments.Select(p => new { p.Year, p.Month, p.Amount })
            .Concat(manualEntries.Select(m => new { m.Year, m.Month, m.Amount }));

        var progression = combinedMonthlyItems
            .GroupBy(p => new { p.Year, p.Month })
            .Select(g => new MonthlyRevenueDto
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                MonthName = GetMonthName(g.Key.Month),
                Amount = g.Sum(p => p.Amount)
            })
            .OrderBy(p => p.Year).ThenBy(p => p.Month)
            .ToList();

        var subjectRevenue = payments
            .GroupBy(p => p.Student.SubjectId)
            .Select(g => new SubjectRevenueDto
            {
                SubjectName = g.First().Student.Subject != null ? g.First().Student.Subject.Name : "Outra",
                Amount = g.Sum(p => p.Amount)
            })
            .ToList();

        var students = await _studentRepo.Query()
            .Include(s => s.Subject)
            .Include(s => s.Level)
            .Include(s => s.MonthlyPayments.Where(p => !p.IsDeleted))
            .Where(s => s.ProfessorId == professorId)
            .ToListAsync();

        var paymentStatuses = new List<StudentPaymentStatusDto>();
        foreach (var student in students)
        {
            var startDate = student.FirstClassDate ?? student.CreatedAt;
            if (targetYear < startDate.Year || (targetYear == startDate.Year && targetMonth < startDate.Month))
            {
                continue;
            }

            if (!student.IsActive && student.LastClassDate.HasValue)
            {
                var lastClass = student.LastClassDate.Value;
                if (targetYear > lastClass.Year || (targetYear == lastClass.Year && targetMonth > lastClass.Month))
                {
                    continue;
                }
            }

            var currentPayment = student.MonthlyPayments
                .FirstOrDefault(p => p.Month == targetMonth && p.Year == targetYear && p.IsPaid);

            paymentStatuses.Add(new StudentPaymentStatusDto
            {
                PaymentId = currentPayment?.Id,
                StudentId = student.Id,
                StudentName = student.Name,
                SubjectName = student.Subject?.Name ?? string.Empty,
                LevelName = student.Level?.Name ?? string.Empty,
                MonthlyPrice = student.MonthlyPrice,
                IsPaid = currentPayment != null,
                AmountPaid = currentPayment?.Amount ?? 0
            });
        }

        return new FinanceDto
        {
            TotalRevenue = totalRevenue,
            MonthlyRevenue = monthlyRevenue,
            YearlyRevenue = yearlyRevenue,
            RevenueProgression = progression,
            RevenueBySubject = subjectRevenue,
            StudentPaymentStatuses = paymentStatuses,
            ManualEntries = manualEntries
                .Where(m => m.Month == targetMonth && m.Year == targetYear)
                .OrderByDescending(m => m.Date)
                .ThenByDescending(m => m.CreatedAt)
                .Select(m => new ManualFinanceEntryDto
                {
                    Id = m.Id,
                    Amount = m.Amount,
                    Date = m.Date,
                    Month = m.Month,
                    Year = m.Year,
                    Description = m.Description
                })
                .ToList()
        };
    }

    private async Task EnsureManualTableAsync()
    {
        try
        {
            await _context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS aura.""ManualFinanceEntries"" (
                    ""Id"" uuid NOT NULL,
                    ""ProfessorId"" uuid NOT NULL,
                    ""Amount"" numeric(18,2) NOT NULL,
                    ""Date"" timestamp without time zone NOT NULL,
                    ""Month"" integer NOT NULL,
                    ""Year"" integer NOT NULL,
                    ""Description"" character varying(500) NOT NULL,
                    ""CreatedAt"" timestamp without time zone NOT NULL,
                    ""UpdatedAt"" timestamp without time zone NULL,
                    ""IsDeleted"" boolean NOT NULL,
                    CONSTRAINT ""PK_ManualFinanceEntries"" PRIMARY KEY (""Id""),
                    CONSTRAINT ""FK_ManualFinanceEntries_Professors_ProfessorId"" FOREIGN KEY (""ProfessorId"") REFERENCES aura.""Professors"" (""Id"") ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS ""IX_ManualFinanceEntries_ProfessorId"" ON aura.""ManualFinanceEntries"" (""ProfessorId"");
            ");
        }
        catch
        {
        }
    }

    public async Task<ManualFinanceEntryDto> CreateManualEntryAsync(Guid professorId, CreateManualFinanceEntryDto dto)
    {
        await EnsureManualTableAsync();
        var cleanDate = DateTime.SpecifyKind(dto.Date, DateTimeKind.Unspecified);
        var entry = new ManualFinanceEntry
        {
            ProfessorId = professorId,
            Amount = dto.Amount,
            Date = cleanDate,
            Month = dto.Month ?? cleanDate.Month,
            Year = dto.Year ?? cleanDate.Year,
            Description = dto.Description
        };
        await _context.ManualFinanceEntries.AddAsync(entry);
        await _context.SaveChangesAsync();

        return new ManualFinanceEntryDto
        {
            Id = entry.Id,
            Amount = entry.Amount,
            Date = entry.Date,
            Month = entry.Month,
            Year = entry.Year,
            Description = entry.Description
        };
    }

    public async Task DeleteManualEntryAsync(Guid id, Guid professorId)
    {
        var entry = await _context.ManualFinanceEntries
            .FirstOrDefaultAsync(m => m.Id == id && m.ProfessorId == professorId)
            ?? throw new KeyNotFoundException("Lançamento manual não encontrado.");
        entry.IsDeleted = true;
        _context.ManualFinanceEntries.Update(entry);
        await _context.SaveChangesAsync();
    }

    private static string GetMonthName(int month)
    {
        return month switch
        {
            1 => "Jan",
            2 => "Fev",
            3 => "Mar",
            4 => "Abr",
            5 => "Mai",
            6 => "Jun",
            7 => "Jul",
            8 => "Ago",
            9 => "Set",
            10 => "Out",
            11 => "Nov",
            12 => "Dez",
            _ => ""
        };
    }
}

public class ClassSheetService : IClassSheetService
{
    private readonly IClassSheetRepository _classSheetRepo;
    private readonly AuraDbContext _context;
    private readonly IMapper _mapper;

    public ClassSheetService(IClassSheetRepository classSheetRepo, AuraDbContext context, IMapper mapper)
    {
        _classSheetRepo = classSheetRepo;
        _context = context;
        _mapper = mapper;
    }

    public async Task<IEnumerable<ClassSheetResponseDto>> GetByLevelIdAsync(Guid levelId, Guid professorId)
    {
        var levelValid = await _context.Levels
            .AnyAsync(l => l.Id == levelId && l.Subject.ProfessorId == professorId);
        if (!levelValid)
            throw new UnauthorizedAccessException("Acesso negado.");

        var sheets = await _classSheetRepo.GetByLevelIdAsync(levelId);
        return _mapper.Map<IEnumerable<ClassSheetResponseDto>>(sheets);
    }

    public async Task<ClassSheetResponseDto> GetByIdAsync(Guid id, Guid? professorId = null)
    {
        var sheet = await _context.ClassSheets
            .Include(cs => cs.Level)
            .ThenInclude(l => l.Subject)
            .FirstOrDefaultAsync(cs => cs.Id == id && !cs.IsDeleted)
            ?? throw new KeyNotFoundException("Ficha de aula não encontrada.");

        if (professorId.HasValue && sheet.Level.Subject.ProfessorId != professorId.Value)
            throw new UnauthorizedAccessException("Acesso negado.");

        return _mapper.Map<ClassSheetResponseDto>(sheet);
    }

    public async Task<ClassSheetResponseDto> CreateAsync(Guid professorId, CreateClassSheetDto dto)
    {
        var levelValid = await _context.Levels
            .AnyAsync(l => l.Id == dto.LevelId && l.Subject.ProfessorId == professorId);
        if (!levelValid)
            throw new UnauthorizedAccessException("Nível inválido ou sem permissão.");

        var sheet = _mapper.Map<ClassSheet>(dto);
        sheet.Content = HtmlSanitizerHelper.Sanitize(dto.Content);
        sheet.CreatedAt = DateTime.UtcNow;
        sheet.UpdatedAt = DateTime.UtcNow;
        await _classSheetRepo.AddAsync(sheet);
        return _mapper.Map<ClassSheetResponseDto>(sheet);
    }

    public async Task<ClassSheetResponseDto> UpdateAsync(Guid id, Guid professorId, UpdateClassSheetDto dto)
    {
        var sheet = await _context.ClassSheets
            .Include(cs => cs.Level)
            .ThenInclude(l => l.Subject)
            .FirstOrDefaultAsync(cs => cs.Id == id && !cs.IsDeleted)
            ?? throw new KeyNotFoundException("Ficha de aula não encontrada.");

        if (sheet.Level.Subject.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        sheet.Title = dto.Title;
        sheet.Content = HtmlSanitizerHelper.Sanitize(dto.Content);
        sheet.UpdatedAt = DateTime.UtcNow;

        await _classSheetRepo.UpdateAsync(sheet);
        return _mapper.Map<ClassSheetResponseDto>(sheet);
    }

    public async Task DeleteAsync(Guid id, Guid professorId)
    {
        var sheet = await _context.ClassSheets
            .Include(cs => cs.Level)
            .ThenInclude(l => l.Subject)
            .FirstOrDefaultAsync(cs => cs.Id == id && !cs.IsDeleted)
            ?? throw new KeyNotFoundException("Ficha de aula não encontrada.");

        if (sheet.Level.Subject.ProfessorId != professorId)
            throw new UnauthorizedAccessException("Acesso negado.");

        await _classSheetRepo.DeleteAsync(sheet);
    }

    public async Task<IEnumerable<ClassSheetResponseDto>> GetReleasedByStudentIdAsync(Guid studentId, Guid professorId)
    {
        var studentValid = await _context.Students
            .AnyAsync(s => s.Id == studentId && s.ProfessorId == professorId);
        if (!studentValid)
            throw new UnauthorizedAccessException("Acesso negado.");

        var sheets = await _context.ClassSheetStudents
            .Where(cs => cs.StudentId == studentId && !cs.ClassSheet.IsDeleted)
            .Select(cs => cs.ClassSheet)
            .ToListAsync();

        return _mapper.Map<IEnumerable<ClassSheetResponseDto>>(sheets);
    }

    public async Task ReleaseToStudentAsync(Guid professorId, Guid studentId, Guid classSheetId)
    {
        var studentValid = await _context.Students
            .AnyAsync(s => s.Id == studentId && s.ProfessorId == professorId);
        var sheetValid = await _context.ClassSheets
            .AnyAsync(cs => cs.Id == classSheetId && cs.Level.Subject.ProfessorId == professorId);

        if (!studentValid || !sheetValid)
            throw new UnauthorizedAccessException("Acesso negado para vincular ficha ao aluno.");

        var exists = await _context.ClassSheetStudents
            .AnyAsync(cs => cs.StudentId == studentId && cs.ClassSheetId == classSheetId);

        if (!exists)
        {
            var relation = new ClassSheetStudent
            {
                StudentId = studentId,
                ClassSheetId = classSheetId
            };
            _context.ClassSheetStudents.Add(relation);
            await _context.SaveChangesAsync();
        }
    }

    public async Task RevokeFromStudentAsync(Guid professorId, Guid studentId, Guid classSheetId)
    {
        var studentValid = await _context.Students
            .AnyAsync(s => s.Id == studentId && s.ProfessorId == professorId);
        if (!studentValid)
            throw new UnauthorizedAccessException("Acesso negado.");

        var relation = await _context.ClassSheetStudents
            .FirstOrDefaultAsync(cs => cs.StudentId == studentId && cs.ClassSheetId == classSheetId);

        if (relation != null)
        {
            _context.ClassSheetStudents.Remove(relation);
            await _context.SaveChangesAsync();
        }
    }
}
