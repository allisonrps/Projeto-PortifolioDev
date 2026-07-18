using Aura.Domain.Entities;

namespace Aura.Domain.Interfaces;

public interface IProfessorRepository : IGenericRepository<Professor>
{
    Task<Professor?> GetByEmailAsync(string email);
}

public interface IStudentRepository : IGenericRepository<Student>
{
    Task<IEnumerable<Student>> GetByProfessorIdAsync(Guid professorId);
    Task<IEnumerable<Student>> GetBySubjectIdAsync(Guid subjectId);
    Task<IEnumerable<Student>> GetByLevelIdAsync(Guid levelId);
    Task<int> CountByProfessorIdAsync(Guid professorId);
    Task<Student?> GetDetailByIdAsync(Guid id);
}

public interface ISubjectRepository : IGenericRepository<Subject>
{
    Task<IEnumerable<Subject>> GetByProfessorIdAsync(Guid professorId);
    Task<Subject?> GetWithLevelsAndStudentsAsync(Guid id);
}

public interface ILevelRepository : IGenericRepository<Level>
{
    Task<IEnumerable<Level>> GetBySubjectIdAsync(Guid subjectId);
}

public interface ILessonRepository : IGenericRepository<Lesson>
{
    Task<IEnumerable<Lesson>> GetByStudentIdAsync(Guid studentId);
    Task<IEnumerable<Lesson>> GetByProfessorIdAsync(Guid professorId);
    Task<IEnumerable<Lesson>> GetUpcomingByProfessorIdAsync(Guid professorId, int count = 5);
}

public interface IMonthlyPaymentRepository : IGenericRepository<MonthlyPayment>
{
    Task<IEnumerable<MonthlyPayment>> GetByStudentIdAsync(Guid studentId);
    Task<decimal> GetPaidSumByProfessorMonthYearAsync(Guid professorId, int month, int year);
    Task<decimal> GetPaidSumByProfessorYearAsync(Guid professorId, int year);
}

public interface IExamRepository : IGenericRepository<Exam>
{
    Task<IEnumerable<Exam>> GetByStudentIdAsync(Guid studentId);
}

public interface IExerciseRepository : IGenericRepository<Exercise>
{
    Task<IEnumerable<Exercise>> GetByStudentIdAsync(Guid studentId);
}

public interface IScheduleRepository : IGenericRepository<Schedule>
{
    Task<IEnumerable<Schedule>> GetByProfessorIdAsync(Guid professorId);
    Task<IEnumerable<Schedule>> GetByStudentIdAsync(Guid studentId);
}

public interface IHolidayRepository : IGenericRepository<Holiday>
{
    Task<IEnumerable<Holiday>> GetByProfessorIdAsync(Guid professorId);
}

public interface ISubscriptionRepository : IGenericRepository<Subscription>
{
    Task<Subscription?> GetActiveByProfessorIdAsync(Guid professorId);
}
