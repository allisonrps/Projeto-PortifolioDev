using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Aura.Application.DTOs.Subjects;
using Aura.Application.DTOs.Students;
using Aura.Application.DTOs.Dashboard;
using Aura.Application.DTOs.Schedule;
using Aura.Application.Services;
using Aura.Domain.Entities;
using Aura.Domain.Interfaces;

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
        if (subject.ProfessorId != professorId) throw new UnauthorizedAccessException();
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
        if (subject.ProfessorId != professorId) throw new UnauthorizedAccessException();
        subject.Name = dto.Name;
        await _subjectRepo.UpdateAsync(subject);
        return _mapper.Map<SubjectResponseDto>(subject);
    }

    public async Task DeleteAsync(Guid id, Guid professorId)
    {
        var subject = await _subjectRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Matéria não encontrada.");
        if (subject.ProfessorId != professorId) throw new UnauthorizedAccessException();
        await _subjectRepo.DeleteAsync(subject);
    }
}

public class LevelService : ILevelService
{
    private readonly ILevelRepository _levelRepo;
    private readonly IMapper _mapper;

    public LevelService(ILevelRepository levelRepo, IMapper mapper)
    {
        _levelRepo = levelRepo;
        _mapper = mapper;
    }

    public async Task<IEnumerable<LevelResponseDto>> GetBySubjectIdAsync(Guid subjectId)
    {
        var levels = await _levelRepo.GetBySubjectIdAsync(subjectId);
        return _mapper.Map<IEnumerable<LevelResponseDto>>(levels);
    }

    public async Task<LevelResponseDto> CreateAsync(CreateLevelDto dto)
    {
        var level = new Level { SubjectId = dto.SubjectId, Name = dto.Name };
        await _levelRepo.AddAsync(level);
        return _mapper.Map<LevelResponseDto>(level);
    }

    public async Task<LevelResponseDto> UpdateAsync(Guid id, UpdateLevelDto dto)
    {
        var level = await _levelRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Nível não encontrado.");
        level.Name = dto.Name;
        await _levelRepo.UpdateAsync(level);
        return _mapper.Map<LevelResponseDto>(level);
    }

    public async Task DeleteAsync(Guid id)
    {
        var level = await _levelRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Nível não encontrado.");
        await _levelRepo.DeleteAsync(level);
    }
}

public class LessonService : ILessonService
{
    private readonly ILessonRepository _lessonRepo;
    private readonly IMapper _mapper;

    public LessonService(ILessonRepository lessonRepo, IMapper mapper)
    {
        _lessonRepo = lessonRepo;
        _mapper = mapper;
    }

    public async Task<IEnumerable<LessonResponseDto>> GetByProfessorIdAsync(Guid professorId)
    {
        var lessons = await _lessonRepo.GetByProfessorIdAsync(professorId);
        var filtered = lessons.Where(l => l.Student.IsActive || (l.Status != "scheduled" && (!l.Student.LastClassDate.HasValue || l.ScheduledAt <= l.Student.LastClassDate.Value)));
        return _mapper.Map<IEnumerable<LessonResponseDto>>(filtered);
    }

    public async Task<IEnumerable<LessonResponseDto>> GetByStudentIdAsync(Guid studentId)
    {
        var lessons = await _lessonRepo.GetByStudentIdAsync(studentId);
        return _mapper.Map<IEnumerable<LessonResponseDto>>(lessons);
    }

    public async Task<IEnumerable<LessonResponseDto>> GetByProfessorWeekAsync(Guid professorId, DateTime weekDate)
    {
        var monday = weekDate.Date.AddDays(-(int)weekDate.DayOfWeek + (int)DayOfWeek.Monday);
        if (weekDate.DayOfWeek == DayOfWeek.Sunday) monday = monday.AddDays(-7);
        var sunday = monday.AddDays(7);

        var lessons = await _lessonRepo.GetByProfessorIdAsync(professorId);
        var weekLessons = lessons
            .Where(l => l.ScheduledAt >= monday && l.ScheduledAt < sunday)
            .Where(l => l.Student.IsActive || (l.Status != "scheduled" && (!l.Student.LastClassDate.HasValue || l.ScheduledAt <= l.Student.LastClassDate.Value)))
            .OrderBy(l => l.ScheduledAt);
        return _mapper.Map<IEnumerable<LessonResponseDto>>(weekLessons);
    }

    public async Task<LessonResponseDto> GetByIdAsync(Guid id)
    {
        var lesson = await _lessonRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Aula não encontrada.");
        return _mapper.Map<LessonResponseDto>(lesson);
    }

    public async Task<LessonResponseDto> CreateAsync(Guid professorId, CreateLessonDto dto)
    {
        var lesson = _mapper.Map<Lesson>(dto);
        lesson.ProfessorId = professorId;
        await _lessonRepo.AddAsync(lesson);
        return _mapper.Map<LessonResponseDto>(lesson);
    }

    public async Task<LessonResponseDto> UpdateAsync(Guid id, UpdateLessonDto dto)
    {
        var lesson = await _lessonRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Aula não encontrada.");
        if (dto.Title != null) lesson.Title = dto.Title;
        if (dto.ScheduledAt.HasValue) lesson.ScheduledAt = dto.ScheduledAt.Value;
        if (dto.DurationMinutes.HasValue) lesson.DurationMinutes = dto.DurationMinutes.Value;
        if (dto.Status != null) lesson.Status = dto.Status;
        if (dto.Notes != null) lesson.Notes = dto.Notes;
        await _lessonRepo.UpdateAsync(lesson);
        return _mapper.Map<LessonResponseDto>(lesson);
    }

    public async Task DeleteAsync(Guid id)
    {
        var lesson = await _lessonRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Aula não encontrada.");
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

    public DashboardService(IStudentRepository studentRepo, ISubjectRepository subjectRepo,
        ILessonRepository lessonRepo, IMonthlyPaymentRepository paymentRepo, IMapper mapper)
    {
        _studentRepo = studentRepo;
        _subjectRepo = subjectRepo;
        _lessonRepo = lessonRepo;
        _paymentRepo = paymentRepo;
        _mapper = mapper;
    }

    public async Task<DashboardDto> GetDashboardAsync(Guid professorId, int? month = null, int? year = null)
    {
        var now = DateTime.UtcNow;
        var selectedYear = year ?? now.Year;
        var selectedMonth = month ?? now.Month;

        var todayStart = now.Date;
        var todayEnd = todayStart.AddDays(1).AddTicks(-1);

        // Fetch students and calculate counts
        var students = await _studentRepo.Query()
            .Where(s => s.ProfessorId == professorId && !s.IsDeleted)
            .ToListAsync();

        var totalStudents = students.Count;
        var activeCount = students.Count(s => s.IsActive);
        var archivedCount = students.Count(s => !s.IsActive);

        // Fetch today's lessons
        var todayLessons = await _lessonRepo.Query()
            .Include(l => l.Student).ThenInclude(s => s.Subject)
            .Include(l => l.Student).ThenInclude(s => s.Level)
            .Where(l => l.ProfessorId == professorId && l.ScheduledAt >= todayStart && l.ScheduledAt <= todayEnd && l.Status == "scheduled" && !l.IsDeleted)
            .OrderBy(l => l.ScheduledAt)
            .ToListAsync();

        // Fetch next upcoming lesson if none today
        Lesson? nextUpcomingLesson = null;
        if (todayLessons.Count == 0)
        {
            nextUpcomingLesson = await _lessonRepo.Query()
                .Include(l => l.Student).ThenInclude(s => s.Subject)
                .Include(l => l.Student).ThenInclude(s => s.Level)
                .Where(l => l.ProfessorId == professorId && l.ScheduledAt > todayEnd && l.Status == "scheduled" && !l.IsDeleted)
                .OrderBy(l => l.ScheduledAt)
                .FirstOrDefaultAsync();
        }

        // Calculate birthday students with resilient timezone handling
        var birthdayStudents = students
            .Where(s => s.BirthDate.HasValue && s.IsActive)
            .Select(s => {
                var rawDate = s.BirthDate.Value;
                // If saved at night (e.g. 21:00, 22:00, 23:00) due to UTC-3 shift on previous systems, shift it to next day
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

        // Calculate overall student attendance rate (completed vs cancelled)
        var attendanceLessons = await _lessonRepo.Query()
            .Where(l => l.ProfessorId == professorId && !l.IsDeleted && (l.Status == "completed" || l.Status == "cancelled"))
            .ToListAsync();

        int completedLessons = attendanceLessons.Count(l => l.Status == "completed");
        int totalAttendanceLessons = attendanceLessons.Count;
        int averageAttendance = totalAttendanceLessons > 0 
            ? (int)Math.Round((double)completedLessons / totalAttendanceLessons * 100) 
            : 100;

        // Fetch all professor lessons for calculations
        var allProfessorLessons = await _lessonRepo.Query()
            .Where(l => l.ProfessorId == professorId && !l.IsDeleted)
            .ToListAsync();

        // Monthly filter (selectedMonth & selectedYear)
        var startOfMonth = new DateTime(selectedYear, selectedMonth, 1, 0, 0, 0, DateTimeKind.Utc);
        var endOfMonth = startOfMonth.AddMonths(1);
        var monthlyLessons = allProfessorLessons
            .Where(l => l.ScheduledAt >= startOfMonth && l.ScheduledAt < endOfMonth)
            .ToList();

        // Yearly filter (selectedYear)
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

        // Calculate Effectiveness Rate (completed vs (completed + cancelled + holiday + past scheduled))
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

        return new DashboardDto
        {
            TotalStudents = totalStudents,
            ActiveStudentsCount = activeCount,
            ArchivedStudentsCount = archivedCount,
            MonthlyLessonsCount = monthlyLessonsCount,
            YearlyLessonsCount = yearlyLessonsCount,
            MonthlyWorkloadHours = monthlyWorkloadHours,
            YearlyWorkloadHours = yearlyWorkloadHours,
            TodayLessons = _mapper.Map<List<LessonResponseDto>>(todayLessons),
            NextUpcomingLesson = nextUpcomingLesson != null ? _mapper.Map<LessonResponseDto>(nextUpcomingLesson) : null,
            BirthdayStudents = birthdayStudents,
            AverageAttendanceRate = averageAttendance,
            SubjectStats = _mapper.Map<List<SubjectStatDto>>(subjects),
            MonthlyLessonStatusStats = monthlyLessonStatusStats,
            YearlyLessonStatusStats = yearlyLessonStatusStats,
            MonthlyEffectivenessRate = monthlyEffectivenessRate,
            YearlyEffectivenessRate = yearlyEffectivenessRate
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
    private readonly IMapper _mapper;

    public PaymentService(IMonthlyPaymentRepository paymentRepo, IMapper mapper)
    {
        _paymentRepo = paymentRepo;
        _mapper = mapper;
    }

    public async Task<IEnumerable<PaymentResponseDto>> GetByStudentIdAsync(Guid studentId)
    {
        var payments = await _paymentRepo.GetByStudentIdAsync(studentId);
        return _mapper.Map<IEnumerable<PaymentResponseDto>>(payments);
    }

    public async Task<PaymentResponseDto> CreateAsync(CreatePaymentDto dto)
    {
        var payment = _mapper.Map<MonthlyPayment>(dto);
        await _paymentRepo.AddAsync(payment);
        return _mapper.Map<PaymentResponseDto>(payment);
    }

    public async Task<PaymentResponseDto> UpdateAsync(Guid id, UpdatePaymentDto dto)
    {
        var payment = await _paymentRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Pagamento não encontrado.");
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

    public async Task DeleteAsync(Guid id)
    {
        var payment = await _paymentRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Pagamento não encontrado.");
        await _paymentRepo.DeleteAsync(payment);
    }
}

public class ExamService : IExamService
{
    private readonly IExamRepository _examRepo;
    private readonly IMapper _mapper;

    public ExamService(IExamRepository examRepo, IMapper mapper)
    {
        _examRepo = examRepo;
        _mapper = mapper;
    }

    public async Task<IEnumerable<ExamResponseDto>> GetByStudentIdAsync(Guid studentId)
    {
        var exams = await _examRepo.GetByStudentIdAsync(studentId);
        return _mapper.Map<IEnumerable<ExamResponseDto>>(exams);
    }

    public async Task<ExamResponseDto> CreateAsync(CreateExamDto dto)
    {
        var exam = _mapper.Map<Exam>(dto);
        await _examRepo.AddAsync(exam);
        return _mapper.Map<ExamResponseDto>(exam);
    }

    public async Task<ExamResponseDto> UpdateAsync(Guid id, UpdateExamDto dto)
    {
        var exam = await _examRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Prova não encontrada.");
        if (dto.Title != null) exam.Title = dto.Title;
        if (dto.ScheduledAt.HasValue) exam.ScheduledAt = dto.ScheduledAt.Value;
        if (dto.Notes != null) exam.Notes = dto.Notes;
        if (dto.Grade.HasValue) exam.Grade = dto.Grade;
        if (dto.MaxGrade.HasValue) exam.MaxGrade = dto.MaxGrade.Value;
        await _examRepo.UpdateAsync(exam);
        return _mapper.Map<ExamResponseDto>(exam);
    }

    public async Task DeleteAsync(Guid id)
    {
        var exam = await _examRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Prova não encontrada.");
        await _examRepo.DeleteAsync(exam);
    }
}

public class ExerciseService : IExerciseService
{
    private readonly IExerciseRepository _exerciseRepo;
    private readonly IMapper _mapper;

    public ExerciseService(IExerciseRepository exerciseRepo, IMapper mapper)
    {
        _exerciseRepo = exerciseRepo;
        _mapper = mapper;
    }

    public async Task<IEnumerable<ExerciseResponseDto>> GetByStudentIdAsync(Guid studentId)
    {
        var exercises = await _exerciseRepo.GetByStudentIdAsync(studentId);
        return _mapper.Map<IEnumerable<ExerciseResponseDto>>(exercises);
    }

    public async Task<ExerciseResponseDto> CreateAsync(CreateExerciseDto dto)
    {
        var exercise = _mapper.Map<Exercise>(dto);
        await _exerciseRepo.AddAsync(exercise);
        return _mapper.Map<ExerciseResponseDto>(exercise);
    }

    public async Task<ExerciseResponseDto> UpdateAsync(Guid id, UpdateExerciseDto dto)
    {
        var exercise = await _exerciseRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Exercício não encontrado.");
        if (dto.Title != null) exercise.Title = dto.Title;
        if (dto.ScheduledAt.HasValue) exercise.ScheduledAt = dto.ScheduledAt.Value;
        if (dto.Notes != null) exercise.Notes = dto.Notes;
        if (dto.Grade.HasValue) exercise.Grade = dto.Grade;
        if (dto.MaxGrade.HasValue) exercise.MaxGrade = dto.MaxGrade.Value;
        await _exerciseRepo.UpdateAsync(exercise);
        return _mapper.Map<ExerciseResponseDto>(exercise);
    }

    public async Task DeleteAsync(Guid id)
    {
        var exercise = await _exerciseRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Exercício não encontrado.");
        await _exerciseRepo.DeleteAsync(exercise);
    }
}

public class ScheduleService : IScheduleService
{
    private readonly IScheduleRepository _scheduleRepo;
    private readonly ILessonRepository _lessonRepo;
    private readonly IHolidayRepository _holidayRepo;
    private readonly IMapper _mapper;

    public ScheduleService(IScheduleRepository scheduleRepo, ILessonRepository lessonRepo,
        IHolidayRepository holidayRepo, IMapper mapper)
    {
        _scheduleRepo = scheduleRepo;
        _lessonRepo = lessonRepo;
        _holidayRepo = holidayRepo;
        _mapper = mapper;
    }

    public async Task<IEnumerable<ScheduleResponseDto>> GetByProfessorIdAsync(Guid professorId)
    {
        var schedules = await _scheduleRepo.GetByProfessorIdAsync(professorId);
        var activeSchedules = schedules.Where(s => s.Student.IsActive);
        return _mapper.Map<IEnumerable<ScheduleResponseDto>>(activeSchedules);
    }

    public async Task<IEnumerable<ScheduleResponseDto>> GetByStudentIdAsync(Guid studentId)
    {
        var schedules = await _scheduleRepo.GetByStudentIdAsync(studentId);
        return _mapper.Map<IEnumerable<ScheduleResponseDto>>(schedules);
    }

    public async Task<ScheduleResponseDto> CreateAsync(Guid professorId, CreateScheduleDto dto)
    {
        var schedule = new Schedule
        {
            ProfessorId = professorId,
            StudentId = dto.StudentId,
            DayOfWeek = dto.DayOfWeek,
            StartTime = TimeSpan.Parse(dto.StartTime),
            EndTime = TimeSpan.Parse(dto.EndTime),
            IsRecurring = dto.IsRecurring,
            ValidFrom = dto.ValidFrom,
            ValidUntil = dto.ValidUntil
        };
        await _scheduleRepo.AddAsync(schedule);

        // Auto-generate lessons for next 4 weeks starting from student registration date
        var student = await _scheduleRepo.Query()
            .Where(s => s.StudentId == dto.StudentId)
            .Select(s => s.Student)
            .FirstOrDefaultAsync();

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

        var baseDate = (student != null && student.FirstClassDate.HasValue) 
            ? student.FirstClassDate.Value.Date 
            : schedule.ValidFrom.Date;

        var endOfYear = schedule.ValidUntil.HasValue 
            ? schedule.ValidUntil.Value.Date 
            : new DateTime(baseDate.Year, 12, 31);

        if ((endOfYear - baseDate).TotalDays < 90)
        {
            endOfYear = new DateTime(baseDate.Year + 1, 12, 31);
        }

        for (var date = baseDate; date <= endOfYear; date = date.AddDays(1))
        {
            if (holidayDates.Contains(date.Date)) continue;

            if ((int)date.DayOfWeek == dto.DayOfWeek)
            {
                var lessonDate = date.Add(schedule.StartTime);
                
                // Check schedule validity range
                if (lessonDate.Date < schedule.ValidFrom.Date || (schedule.ValidUntil.HasValue && lessonDate.Date > schedule.ValidUntil.Value.Date))
                {
                    continue;
                }

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

    public async Task<ScheduleResponseDto> UpdateAsync(Guid id, UpdateScheduleDto dto)
    {
        var schedule = await _scheduleRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Agendamento não encontrado.");
        
        if (dto.StudentId.HasValue) schedule.StudentId = dto.StudentId.Value;
        if (dto.DayOfWeek.HasValue) schedule.DayOfWeek = dto.DayOfWeek.Value;
        if (dto.StartTime != null) schedule.StartTime = TimeSpan.Parse(dto.StartTime);
        if (dto.EndTime != null) schedule.EndTime = TimeSpan.Parse(dto.EndTime);
        if (dto.IsRecurring.HasValue) schedule.IsRecurring = dto.IsRecurring.Value;
        if (dto.ValidFrom.HasValue) schedule.ValidFrom = dto.ValidFrom.Value;
        schedule.ValidUntil = dto.ValidUntil; // Allow clearing or updating

        await _scheduleRepo.UpdateAsync(schedule);

        // Delete future scheduled lessons for this student
        var today = DateTime.Today;
        var futureLessons = await _lessonRepo.Query()
            .Where(l => l.StudentId == schedule.StudentId && l.ScheduledAt >= today && l.Status == "scheduled" && !l.IsDeleted)
            .ToListAsync();

        foreach (var lesson in futureLessons)
        {
            await _lessonRepo.DeleteAsync(lesson);
        }

        // Regenerate future lessons until end of year based on new schedule configuration
        var student = await _scheduleRepo.Query()
            .Where(s => s.StudentId == schedule.StudentId)
            .Select(s => s.Student)
            .FirstOrDefaultAsync();

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

        var updateBaseDate = (student != null && student.FirstClassDate.HasValue) 
            ? (student.FirstClassDate.Value.Date > today ? student.FirstClassDate.Value.Date : today)
            : (schedule.ValidFrom.Date > today ? schedule.ValidFrom.Date : today);

        var updateEndOfYear = schedule.ValidUntil.HasValue 
            ? schedule.ValidUntil.Value.Date 
            : new DateTime(updateBaseDate.Year, 12, 31);

        if ((updateEndOfYear - updateBaseDate).TotalDays < 90)
        {
            updateEndOfYear = new DateTime(updateBaseDate.Year + 1, 12, 31);
        }

        for (var date = updateBaseDate; date <= updateEndOfYear; date = date.AddDays(1))
        {
            if (holidayDates.Contains(date.Date)) continue;

            if ((int)date.DayOfWeek == schedule.DayOfWeek)
            {
                var lessonDate = date.Add(schedule.StartTime);
                
                // Check schedule validity range
                if (lessonDate.Date < schedule.ValidFrom.Date || (schedule.ValidUntil.HasValue && lessonDate.Date > schedule.ValidUntil.Value.Date))
                {
                    continue;
                }

                var exists = await _lessonRepo.Query().AnyAsync(l => l.StudentId == schedule.StudentId && l.ScheduledAt == lessonDate && !l.IsDeleted);
                if (exists) continue;

                var lesson = new Lesson
                {
                    ProfessorId = schedule.ProfessorId,
                    StudentId = schedule.StudentId,
                    ScheduledAt = lessonDate,
                    DurationMinutes = (int)(schedule.EndTime - schedule.StartTime).TotalMinutes,
                    Status = "scheduled"
                };
                await _lessonRepo.AddAsync(lesson);
            }
        }

        return _mapper.Map<ScheduleResponseDto>(schedule);
    }

    public async Task DeleteAsync(Guid id)
    {
        var schedule = await _scheduleRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Agendamento não encontrado.");
        await _scheduleRepo.DeleteAsync(schedule);
    }

    public async Task<int> ReplicateWeekAsync(Guid professorId, Application.DTOs.Schedule.ReplicateWeekDto dto)
    {
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
                var lessonDate = date.Add(schedule.StartTime);
                
                // Do not schedule classes in the past
                if (lessonDate <= DateTime.UtcNow)
                {
                    continue;
                }

                // Check schedule validity range
                if (lessonDate.Date < schedule.ValidFrom.Date || (schedule.ValidUntil.HasValue && lessonDate.Date > schedule.ValidUntil.Value.Date))
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

    public async Task<HolidayResponseDto> UpdateAsync(Guid id, UpdateHolidayDto dto)
    {
        var holiday = await _holidayRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Feriado não encontrado.");
        if (dto.Name != null) holiday.Name = dto.Name;
        if (dto.Date.HasValue) holiday.Date = dto.Date;
        if (dto.IsVacationPeriod.HasValue) holiday.IsVacationPeriod = dto.IsVacationPeriod.Value;
        if (dto.VacationStart.HasValue) holiday.VacationStart = dto.VacationStart;
        if (dto.VacationEnd.HasValue) holiday.VacationEnd = dto.VacationEnd;
        await _holidayRepo.UpdateAsync(holiday);
        return _mapper.Map<HolidayResponseDto>(holiday);
    }

    public async Task DeleteAsync(Guid id)
    {
        var holiday = await _holidayRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Feriado não encontrado.");
        await _holidayRepo.DeleteAsync(holiday);
    }
}

public class FileStorageService : IFileStorageService
{
    private readonly string _basePath;

    public FileStorageService(string basePath)
    {
        _basePath = basePath;
    }

    public async Task<string> SaveFileAsync(Stream stream, string fileName, string folder)
    {
        var ext = Path.GetExtension(fileName);
        var uniqueName = $"{Guid.NewGuid()}{ext}";
        var folderPath = Path.Combine(_basePath, "uploads", folder);
        Directory.CreateDirectory(folderPath);
        var filePath = Path.Combine(folderPath, uniqueName);

        using var fileStream = new FileStream(filePath, FileMode.Create);
        await stream.CopyToAsync(fileStream);

        return $"/uploads/{folder}/{uniqueName}";
    }

    public void DeleteFile(string relativePath)
    {
        if (string.IsNullOrEmpty(relativePath)) return;
        var fullPath = Path.Combine(_basePath, relativePath.TrimStart('/'));
        if (File.Exists(fullPath)) File.Delete(fullPath);
    }
}

public class FinanceService : IFinanceService
{
    private readonly IStudentRepository _studentRepo;
    private readonly IMonthlyPaymentRepository _paymentRepo;
    private readonly IMapper _mapper;

    public FinanceService(IStudentRepository studentRepo, IMonthlyPaymentRepository paymentRepo, IMapper mapper)
    {
        _studentRepo = studentRepo;
        _paymentRepo = paymentRepo;
        _mapper = mapper;
    }

    public async Task<FinanceDto> GetFinanceDataAsync(Guid professorId, int? month, int? year)
    {
        var now = DateTime.UtcNow;
        int targetMonth = month ?? now.Month;
        int targetYear = year ?? now.Year;

        // Fetch all paid payments for this professor's students
        var payments = await _paymentRepo.Query()
            .Include(p => p.Student)
            .ThenInclude(s => s.Subject)
            .Where(p => p.Student.ProfessorId == professorId && p.IsPaid && !p.IsDeleted)
            .ToListAsync();

        var totalRevenue = payments.Sum(p => p.Amount);
        var monthlyRevenue = payments.Where(p => p.Month == targetMonth && p.Year == targetYear).Sum(p => p.Amount);
        var yearlyRevenue = payments.Where(p => p.Year == targetYear).Sum(p => p.Amount);

        // Revenue progression by month
        var progression = payments
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

        // Revenue by subject
        var subjectRevenue = payments
            .GroupBy(p => p.Student.SubjectId)
            .Select(g => new SubjectRevenueDto
            {
                SubjectName = g.First().Student.Subject != null ? g.First().Student.Subject.Name : "Outra",
                Amount = g.Sum(p => p.Amount)
            })
            .ToList();

        // Target month student payment statuses
        var students = await _studentRepo.Query()
            .Include(s => s.Subject)
            .Include(s => s.Level)
            .Include(s => s.MonthlyPayments.Where(p => !p.IsDeleted))
            .Where(s => s.ProfessorId == professorId)
            .ToListAsync();

        var paymentStatuses = new List<StudentPaymentStatusDto>();
        foreach (var student in students)
        {
            // Skip student if target month/year is before their first class date (or creation date)
            var startDate = student.FirstClassDate ?? student.CreatedAt;
            if (targetYear < startDate.Year || (targetYear == startDate.Year && targetMonth < startDate.Month))
            {
                continue;
            }

            // If student is inactive, hide them from monthly status if target month is after their LastClassDate
            if (!student.IsActive && student.LastClassDate.HasValue)
            {
                var lastClass = student.LastClassDate.Value;
                if (targetYear > lastClass.Year || (targetYear == lastClass.Year && targetMonth > lastClass.Month))
                {
                    continue; // Skip inactive student since they ended before this period
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
            StudentPaymentStatuses = paymentStatuses
        };
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
