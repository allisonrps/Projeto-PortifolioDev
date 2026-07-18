using Aura.Application.DTOs.Students;
using Aura.Application.DTOs.Subjects;
using Aura.Application.DTOs.Dashboard;
using Aura.Application.DTOs.Schedule;

namespace Aura.Application.Services;

public interface IStudentService
{
    Task<IEnumerable<StudentResponseDto>> GetByProfessorIdAsync(Guid professorId);
    Task<StudentDetailDto> GetDetailAsync(Guid id, Guid professorId);
    Task<StudentResponseDto> CreateAsync(Guid professorId, CreateStudentDto dto);
    Task<StudentResponseDto> UpdateAsync(Guid id, Guid professorId, UpdateStudentDto dto);
    Task DeleteAsync(Guid id, Guid professorId);
    Task<string> UploadPhotoAsync(Guid id, Guid professorId, Stream stream, string fileName);
}

public interface ISubjectService
{
    Task<IEnumerable<SubjectResponseDto>> GetByProfessorIdAsync(Guid professorId);
    Task<SubjectResponseDto> GetByIdAsync(Guid id, Guid professorId);
    Task<SubjectResponseDto> CreateAsync(Guid professorId, CreateSubjectDto dto);
    Task<SubjectResponseDto> UpdateAsync(Guid id, Guid professorId, UpdateSubjectDto dto);
    Task DeleteAsync(Guid id, Guid professorId);
}

public interface ILevelService
{
    Task<IEnumerable<LevelResponseDto>> GetBySubjectIdAsync(Guid subjectId);
    Task<LevelResponseDto> CreateAsync(CreateLevelDto dto);
    Task<LevelResponseDto> UpdateAsync(Guid id, UpdateLevelDto dto);
    Task DeleteAsync(Guid id);
}

public interface ILessonService
{
    Task<IEnumerable<LessonResponseDto>> GetByProfessorIdAsync(Guid professorId);
    Task<IEnumerable<LessonResponseDto>> GetByStudentIdAsync(Guid studentId);
    Task<IEnumerable<LessonResponseDto>> GetByProfessorWeekAsync(Guid professorId, DateTime weekDate);
    Task<LessonResponseDto> GetByIdAsync(Guid id);
    Task<LessonResponseDto> CreateAsync(Guid professorId, CreateLessonDto dto);
    Task<LessonResponseDto> UpdateAsync(Guid id, UpdateLessonDto dto);
    Task DeleteAsync(Guid id);
}

public interface IDashboardService
{
    Task<DashboardDto> GetDashboardAsync(Guid professorId);
}

public interface IFinanceService
{
    Task<FinanceDto> GetFinanceDataAsync(Guid professorId, int? month, int? year);
}

public interface IScheduleService
{
    Task<IEnumerable<ScheduleResponseDto>> GetByProfessorIdAsync(Guid professorId);
    Task<IEnumerable<ScheduleResponseDto>> GetByStudentIdAsync(Guid studentId);
    Task<ScheduleResponseDto> CreateAsync(Guid professorId, CreateScheduleDto dto);
    Task<ScheduleResponseDto> UpdateAsync(Guid id, UpdateScheduleDto dto);
    Task DeleteAsync(Guid id);
    Task<int> ReplicateWeekAsync(Guid professorId, ReplicateWeekDto dto);
}

public interface IPaymentService
{
    Task<IEnumerable<PaymentResponseDto>> GetByStudentIdAsync(Guid studentId);
    Task<PaymentResponseDto> CreateAsync(CreatePaymentDto dto);
    Task<PaymentResponseDto> UpdateAsync(Guid id, UpdatePaymentDto dto);
    Task DeleteAsync(Guid id);
}

public interface IExamService
{
    Task<IEnumerable<ExamResponseDto>> GetByStudentIdAsync(Guid studentId);
    Task<ExamResponseDto> CreateAsync(CreateExamDto dto);
    Task<ExamResponseDto> UpdateAsync(Guid id, UpdateExamDto dto);
    Task DeleteAsync(Guid id);
}

public interface IExerciseService
{
    Task<IEnumerable<ExerciseResponseDto>> GetByStudentIdAsync(Guid studentId);
    Task<ExerciseResponseDto> CreateAsync(CreateExerciseDto dto);
    Task<ExerciseResponseDto> UpdateAsync(Guid id, UpdateExerciseDto dto);
    Task DeleteAsync(Guid id);
}

public interface IHolidayService
{
    Task<IEnumerable<HolidayResponseDto>> GetByProfessorIdAsync(Guid professorId);
    Task<HolidayResponseDto> CreateAsync(Guid professorId, CreateHolidayDto dto);
    Task<HolidayResponseDto> UpdateAsync(Guid id, UpdateHolidayDto dto);
    Task DeleteAsync(Guid id);
}
