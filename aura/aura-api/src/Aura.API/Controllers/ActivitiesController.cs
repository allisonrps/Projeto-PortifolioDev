using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Aura.Application.DTOs.Activity;
using Aura.Application.Services;

namespace Aura.API.Controllers;

[Route("api/activities")]
public class ActivitiesController : BaseApiController
{
    private readonly IActivityService _activityService;

    public ActivitiesController(IActivityService activityService)
    {
        _activityService = activityService;
    }

    [HttpPost("templates")]
    public async Task<ActionResult<TemplateResponseDto>> CreateTemplate([FromBody] CreateTemplateDto dto)
    {
        var result = await _activityService.CreateTemplateAsync(GetProfessorId(), dto);
        return Created("", result);
    }

    [HttpGet("templates")]
    public async Task<ActionResult<List<TemplateResponseDto>>> GetTemplates()
    {
        var result = await _activityService.GetTemplatesByProfessorAsync(GetProfessorId());
        return Ok(result);
    }

    [HttpDelete("templates/{id}")]
    public async Task<IActionResult> DeleteTemplate(Guid id)
    {
        await _activityService.DeleteTemplateAsync(GetProfessorId(), id);
        return NoContent();
    }

    [HttpPost("assign")]
    public async Task<ActionResult<StudentActivityResponseDto>> AssignActivity([FromBody] AssignActivityDto dto)
    {
        var result = await _activityService.AssignActivityToStudentAsync(GetProfessorId(), dto);
        return Created("", result);
    }

    [HttpGet("student/{studentId}")]
    public async Task<ActionResult<List<StudentActivityResponseDto>>> GetStudentActivities(Guid studentId)
    {
        var result = await _activityService.GetStudentActivitiesAsync(studentId);
        return Ok(result);
    }

    [HttpGet("review/{activityId}")]
    public async Task<ActionResult<StudentActivityResponseDto>> GetActivityReview(Guid activityId)
    {
        var result = await _activityService.GetActivityReviewAsync(GetProfessorId(), activityId);
        return Ok(result);
    }

    [HttpGet("public/{activityId}")]
    [AllowAnonymous]
    public async Task<ActionResult<StudentActivityResponseDto>> GetPublicActivity(Guid activityId)
    {
        var result = await _activityService.GetStudentActivityForSubmissionAsync(activityId);
        return Ok(result);
    }

    [HttpPost("public/{activityId}/submit")]
    [AllowAnonymous]
    public async Task<ActionResult<StudentActivityResponseDto>> SubmitActivity(Guid activityId, [FromBody] SubmitActivityDto dto)
    {
        var result = await _activityService.SubmitActivityAsync(activityId, dto);
        return Ok(result);
    }
}
