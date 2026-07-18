using Microsoft.EntityFrameworkCore;
using Aura.Domain.Entities;
using Aura.Domain.Interfaces;
using Aura.Infrastructure.Data;

namespace Aura.Infrastructure.Repositories;

public class GenericRepository<T> : IGenericRepository<T> where T : BaseEntity
{
    protected readonly AuraDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public GenericRepository(AuraDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public virtual async Task<T?> GetByIdAsync(Guid id)
        => await _dbSet.FirstOrDefaultAsync(e => e.Id == id);

    public virtual async Task<IEnumerable<T>> GetAllAsync()
        => await _dbSet.ToListAsync();

    public virtual async Task<T> AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        await _context.SaveChangesAsync();
        return entity;
    }

    public virtual async Task UpdateAsync(T entity)
    {
        _dbSet.Update(entity);
        await _context.SaveChangesAsync();
    }

    public virtual async Task DeleteAsync(T entity)
    {
        entity.IsDeleted = true;
        await UpdateAsync(entity);
    }

    public IQueryable<T> Query() => _dbSet.AsQueryable();
}

// Professor Repository
public class ProfessorRepository : GenericRepository<Professor>, IProfessorRepository
{
    public ProfessorRepository(AuraDbContext context) : base(context) { }

    public async Task<Professor?> GetByEmailAsync(string email)
        => await _dbSet.FirstOrDefaultAsync(p => p.Email.ToLower() == email.ToLower());
}

// Student Repository
public class StudentRepository : GenericRepository<Student>, IStudentRepository
{
    public StudentRepository(AuraDbContext context) : base(context) { }

    public async Task<IEnumerable<Student>> GetByProfessorIdAsync(Guid professorId)
        => await _dbSet.Include(s => s.Subject).Include(s => s.Level)
            .Include(s => s.Lessons.Where(l => !l.IsDeleted))
            .Where(s => s.ProfessorId == professorId)
            .OrderBy(s => s.Name).ToListAsync();

    public async Task<IEnumerable<Student>> GetBySubjectIdAsync(Guid subjectId)
        => await _dbSet.Include(s => s.Subject).Include(s => s.Level)
            .Include(s => s.Lessons.Where(l => !l.IsDeleted))
            .Where(s => s.SubjectId == subjectId)
            .OrderBy(s => s.Name).ToListAsync();

    public async Task<IEnumerable<Student>> GetByLevelIdAsync(Guid levelId)
        => await _dbSet.Include(s => s.Subject).Include(s => s.Level)
            .Include(s => s.Lessons.Where(l => !l.IsDeleted))
            .Where(s => s.LevelId == levelId)
            .OrderBy(s => s.Name).ToListAsync();

    public async Task<int> CountByProfessorIdAsync(Guid professorId)
        => await _dbSet.CountAsync(s => s.ProfessorId == professorId);

    public async Task<Student?> GetDetailByIdAsync(Guid id)
        => await _dbSet
            .Include(s => s.Subject).Include(s => s.Level)
            .Include(s => s.Lessons.Where(l => !l.IsDeleted).OrderByDescending(l => l.ScheduledAt))
            .Include(s => s.MonthlyPayments.Where(p => !p.IsDeleted).OrderBy(p => p.Year).ThenBy(p => p.Month))
            .Include(s => s.Exams.Where(e => !e.IsDeleted).OrderByDescending(e => e.ScheduledAt))
            .Include(s => s.Exercises.Where(e => !e.IsDeleted).OrderByDescending(e => e.ScheduledAt))
            .FirstOrDefaultAsync(s => s.Id == id);
}

// Subject Repository
public class SubjectRepository : GenericRepository<Subject>, ISubjectRepository
{
    public SubjectRepository(AuraDbContext context) : base(context) { }

    public async Task<IEnumerable<Subject>> GetByProfessorIdAsync(Guid professorId)
        => await _dbSet.Include(s => s.Levels.Where(l => !l.IsDeleted))
            .Include(s => s.Students.Where(st => !st.IsDeleted))
            .Where(s => s.ProfessorId == professorId)
            .OrderBy(s => s.Name).ToListAsync();

    public async Task<Subject?> GetWithLevelsAndStudentsAsync(Guid id)
        => await _dbSet
            .Include(s => s.Levels.Where(l => !l.IsDeleted))
                .ThenInclude(l => l.Students.Where(st => !st.IsDeleted))
            .Include(s => s.Students.Where(st => !st.IsDeleted))
            .FirstOrDefaultAsync(s => s.Id == id);
}

// Level Repository
public class LevelRepository : GenericRepository<Level>, ILevelRepository
{
    public LevelRepository(AuraDbContext context) : base(context) { }

    public async Task<IEnumerable<Level>> GetBySubjectIdAsync(Guid subjectId)
        => await _dbSet.Include(l => l.Students.Where(s => !s.IsDeleted))
            .Where(l => l.SubjectId == subjectId)
            .OrderBy(l => l.Name).ToListAsync();
}

// Lesson Repository
public class LessonRepository : GenericRepository<Lesson>, ILessonRepository
{
    public LessonRepository(AuraDbContext context) : base(context) { }

    public async Task<IEnumerable<Lesson>> GetByStudentIdAsync(Guid studentId)
        => await _dbSet.Include(l => l.Student)
            .Where(l => l.StudentId == studentId)
            .OrderByDescending(l => l.ScheduledAt).ToListAsync();

    public async Task<IEnumerable<Lesson>> GetByProfessorIdAsync(Guid professorId)
        => await _dbSet.Include(l => l.Student)
            .Where(l => l.ProfessorId == professorId)
            .OrderByDescending(l => l.ScheduledAt).ToListAsync();

    public async Task<IEnumerable<Lesson>> GetUpcomingByProfessorIdAsync(Guid professorId, int count = 5)
        => await _dbSet.Include(l => l.Student)
            .Where(l => l.ProfessorId == professorId && l.ScheduledAt >= DateTime.UtcNow && l.Status == "scheduled")
            .OrderBy(l => l.ScheduledAt)
            .Take(count).ToListAsync();
}

// MonthlyPayment Repository
public class MonthlyPaymentRepository : GenericRepository<MonthlyPayment>, IMonthlyPaymentRepository
{
    public MonthlyPaymentRepository(AuraDbContext context) : base(context) { }

    public async Task<IEnumerable<MonthlyPayment>> GetByStudentIdAsync(Guid studentId)
        => await _dbSet.Include(p => p.Student)
            .Where(p => p.StudentId == studentId)
            .OrderBy(p => p.Year).ThenBy(p => p.Month).ToListAsync();

    public async Task<decimal> GetPaidSumByProfessorMonthYearAsync(Guid professorId, int month, int year)
        => await _dbSet.Include(p => p.Student)
            .Where(p => p.Student.ProfessorId == professorId && p.Month == month && p.Year == year && p.IsPaid)
            .SumAsync(p => p.Amount);

    public async Task<decimal> GetPaidSumByProfessorYearAsync(Guid professorId, int year)
        => await _dbSet.Include(p => p.Student)
            .Where(p => p.Student.ProfessorId == professorId && p.Year == year && p.IsPaid)
            .SumAsync(p => p.Amount);
}

// Exam Repository
public class ExamRepository : GenericRepository<Exam>, IExamRepository
{
    public ExamRepository(AuraDbContext context) : base(context) { }

    public async Task<IEnumerable<Exam>> GetByStudentIdAsync(Guid studentId)
        => await _dbSet.Include(e => e.Student)
            .Where(e => e.StudentId == studentId)
            .OrderByDescending(e => e.ScheduledAt).ToListAsync();
}

// Exercise Repository
public class ExerciseRepository : GenericRepository<Exercise>, IExerciseRepository
{
    public ExerciseRepository(AuraDbContext context) : base(context) { }

    public async Task<IEnumerable<Exercise>> GetByStudentIdAsync(Guid studentId)
        => await _dbSet.Include(e => e.Student)
            .Where(e => e.StudentId == studentId)
            .OrderByDescending(e => e.ScheduledAt).ToListAsync();
}

// Schedule Repository
public class ScheduleRepository : GenericRepository<Schedule>, IScheduleRepository
{
    public ScheduleRepository(AuraDbContext context) : base(context) { }

    public async Task<IEnumerable<Schedule>> GetByProfessorIdAsync(Guid professorId)
        => await _dbSet.Include(s => s.Student)
            .Where(s => s.ProfessorId == professorId)
            .OrderBy(s => s.DayOfWeek).ThenBy(s => s.StartTime).ToListAsync();

    public async Task<IEnumerable<Schedule>> GetByStudentIdAsync(Guid studentId)
        => await _dbSet.Include(s => s.Student)
            .Where(s => s.StudentId == studentId)
            .OrderBy(s => s.DayOfWeek).ThenBy(s => s.StartTime).ToListAsync();
}

// Holiday Repository
public class HolidayRepository : GenericRepository<Holiday>, IHolidayRepository
{
    public HolidayRepository(AuraDbContext context) : base(context) { }

    public async Task<IEnumerable<Holiday>> GetByProfessorIdAsync(Guid professorId)
        => await _dbSet.Where(h => h.ProfessorId == professorId)
            .OrderBy(h => h.Date).ToListAsync();
}

// Subscription Repository
public class SubscriptionRepository : GenericRepository<Subscription>, ISubscriptionRepository
{
    public SubscriptionRepository(AuraDbContext context) : base(context) { }

    public async Task<Subscription?> GetActiveByProfessorIdAsync(Guid professorId)
        => await _dbSet.FirstOrDefaultAsync(s => s.ProfessorId == professorId && s.Status == "active");
}
