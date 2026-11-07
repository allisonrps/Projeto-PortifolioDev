using Aura.Application.DTOs.Students;
using Aura.Application.DTOs.Subjects;
using Aura.Application.DTOs.Dashboard;
using Aura.Application.DTOs.Schedule;
using Aura.Application.DTOs.Subscription;
using Aura.Application.DTOs.Admin;

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
    Task<IEnumerable<LevelResponseDto>> GetBySubjectIdAsync(Guid subjectId, Guid professorId);
    Task<LevelResponseDto> CreateAsync(Guid professorId, CreateLevelDto dto);
    Task<LevelResponseDto> UpdateAsync(Guid id, Guid professorId, UpdateLevelDto dto);
    Task DeleteAsync(Guid id, Guid professorId);
}

public interface ILessonService
{
    Task<IEnumerable<LessonResponseDto>> GetByProfessorIdAsync(Guid professorId);
    Task<IEnumerable<LessonResponseDto>> GetByStudentIdAsync(Guid studentId, Guid professorId);
    Task<IEnumerable<LessonResponseDto>> GetByProfessorWeekAsync(Guid professorId, DateTime weekDate);
    Task<LessonResponseDto> GetByIdAsync(Guid id, Guid professorId);
    Task<LessonResponseDto> CreateAsync(Guid professorId, CreateLessonDto dto);
    Task<LessonResponseDto> UpdateAsync(Guid id, Guid professorId, UpdateLessonDto dto);
    Task DeleteAsync(Guid id, Guid professorId);
}

public interface IDashboardService
{
    Task<DashboardDto> GetDashboardAsync(Guid professorId, int? month = null, int? year = null);
}

public interface IFinanceService
{
    Task<FinanceDto> GetFinanceDataAsync(Guid professorId, int? month, int? year);
    Task<ManualFinanceEntryDto> CreateManualEntryAsync(Guid professorId, CreateManualFinanceEntryDto dto);
    Task DeleteManualEntryAsync(Guid id, Guid professorId);
}

public interface IScheduleService
{
    Task<IEnumerable<ScheduleResponseDto>> GetByProfessorIdAsync(Guid professorId);
    Task<IEnumerable<ScheduleResponseDto>> GetByStudentIdAsync(Guid studentId, Guid professorId);
    Task<ScheduleResponseDto> CreateAsync(Guid professorId, CreateScheduleDto dto);
    Task<ScheduleResponseDto> UpdateAsync(Guid id, Guid professorId, UpdateScheduleDto dto);
    Task DeleteAsync(Guid id, Guid professorId);
    Task<int> ReplicateWeekAsync(Guid professorId, ReplicateWeekDto dto);
    Task EndScheduleAsync(Guid id, Guid professorId, DateTime endDate);
}

public interface IPaymentService
{
    Task<IEnumerable<PaymentResponseDto>> GetByStudentIdAsync(Guid studentId, Guid professorId);
    Task<PaymentResponseDto> CreateAsync(Guid professorId, CreatePaymentDto dto);
    Task<PaymentResponseDto> UpdateAsync(Guid id, Guid professorId, UpdatePaymentDto dto);
    Task DeleteAsync(Guid id, Guid professorId);
}

public interface IExamService
{
    Task<IEnumerable<ExamResponseDto>> GetByStudentIdAsync(Guid studentId, Guid professorId);
    Task<ExamResponseDto> CreateAsync(Guid professorId, CreateExamDto dto);
    Task<ExamResponseDto> UpdateAsync(Guid id, Guid professorId, UpdateExamDto dto);
    Task DeleteAsync(Guid id, Guid professorId);
}

public interface IExerciseService
{
    Task<IEnumerable<ExerciseResponseDto>> GetByStudentIdAsync(Guid studentId, Guid professorId);
    Task<ExerciseResponseDto> CreateAsync(Guid professorId, CreateExerciseDto dto);
    Task<ExerciseResponseDto> UpdateAsync(Guid id, Guid professorId, UpdateExerciseDto dto);
    Task DeleteAsync(Guid id, Guid professorId);
}

public interface IHolidayService
{
    Task<IEnumerable<HolidayResponseDto>> GetByProfessorIdAsync(Guid professorId);
    Task<HolidayResponseDto> CreateAsync(Guid professorId, CreateHolidayDto dto);
    Task<HolidayResponseDto> UpdateAsync(Guid id, Guid professorId, UpdateHolidayDto dto);
    Task DeleteAsync(Guid id, Guid professorId);
}

public interface IClassSheetService
{
    Task<IEnumerable<ClassSheetResponseDto>> GetByLevelIdAsync(Guid levelId, Guid professorId);
    Task<ClassSheetResponseDto> GetByIdAsync(Guid id, Guid? professorId = null);
    Task<ClassSheetResponseDto> CreateAsync(Guid professorId, CreateClassSheetDto dto);
    Task<ClassSheetResponseDto> UpdateAsync(Guid id, Guid professorId, UpdateClassSheetDto dto);
    Task DeleteAsync(Guid id, Guid professorId);
    Task<IEnumerable<ClassSheetResponseDto>> GetReleasedByStudentIdAsync(Guid studentId, Guid professorId);
    Task ReleaseToStudentAsync(Guid professorId, Guid studentId, Guid classSheetId);
    Task RevokeFromStudentAsync(Guid professorId, Guid studentId, Guid classSheetId);
}

public interface ISubscriptionService
{
    Task<SubscriptionSummaryDto> GetSummaryAsync(Guid professorId);
    Task<SubscriptionCheckoutResponseDto> CreateCheckoutAsync(Guid professorId, CreateCheckoutDto dto);
    Task<SubscriptionSummaryDto> VerifySubscriptionStatusAsync(Guid professorId, Guid subscriptionId, bool simulateConfirmIfDemo = false);
    Task HandleAsaasWebhookAsync(AsaasWebhookPayloadDto payload, string? webhookTokenHeader);
}

public interface IAdminService
{
    Task<AdminDashboardDto> GetAdminDashboardAsync(Guid requesterProfessorId);
    Task<AdminDashboardDto> UpdateProfessorLicenseAsync(Guid requesterProfessorId, Guid targetProfessorId, AdminUpdateLicenseDto dto);
    Task<AdminDashboardDto> PreActivateOrAssignEmailAsync(Guid requesterProfessorId, AdminPreActivateEmailDto dto);
    Task<AdminDashboardDto> UpdateGatewayConfigAsync(Guid requesterProfessorId, AdminGatewayConfigDto dto);
}
