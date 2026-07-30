using Aura.Application.DTOs.Activity;

namespace Aura.Application.Services;

public interface IActivityService
{
    Task<TemplateResponseDto> CreateTemplateAsync(Guid professorId, CreateTemplateDto dto);
    Task<List<TemplateResponseDto>> GetTemplatesByProfessorAsync(Guid professorId);
    Task DeleteTemplateAsync(Guid professorId, Guid templateId);
    Task<StudentActivityResponseDto> AssignActivityToStudentAsync(Guid professorId, AssignActivityDto dto);
    Task<List<StudentActivityResponseDto>> GetStudentActivitiesAsync(Guid studentId);
    Task<StudentActivityResponseDto> GetStudentActivityForSubmissionAsync(Guid activityId);
    Task<StudentActivityResponseDto> SubmitActivityAsync(Guid activityId, SubmitActivityDto dto);
    Task<StudentActivityResponseDto> GetActivityReviewAsync(Guid professorId, Guid activityId);
}
