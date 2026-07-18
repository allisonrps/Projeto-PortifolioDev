using Microsoft.AspNetCore.Mvc;
using Aura.Application.DTOs.Students;
using Aura.Application.DTOs.Dashboard;
using Aura.Application.DTOs.Schedule;
using Aura.Application.Services;

namespace Aura.API.Controllers;

[Route("api/lessons")]
public class LessonsController : BaseApiController
{
    private readonly ILessonService _lessonService;

    public LessonsController(ILessonService lessonService) => _lessonService = lessonService;

    [HttpGet]
    public async Task<ActionResult> GetAll()
        => Ok(await _lessonService.GetByProfessorIdAsync(GetProfessorId()));

    [HttpGet("by-student/{studentId}")]
    public async Task<ActionResult> GetByStudent(Guid studentId)
        => Ok(await _lessonService.GetByStudentIdAsync(studentId));

    [HttpGet("week")]
    public async Task<ActionResult> GetWeek([FromQuery] DateTime date)
        => Ok(await _lessonService.GetByProfessorWeekAsync(GetProfessorId(), date));

    [HttpGet("{id}")]
    public async Task<ActionResult> GetById(Guid id)
        => Ok(await _lessonService.GetByIdAsync(id));

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] CreateLessonDto dto)
    {
        var result = await _lessonService.CreateAsync(GetProfessorId(), dto);
        return Created($"/api/lessons/{result.Id}", result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(Guid id, [FromBody] UpdateLessonDto dto)
        => Ok(await _lessonService.UpdateAsync(id, dto));

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        await _lessonService.DeleteAsync(id);
        return NoContent();
    }
}

[Route("api/dashboard")]
public class DashboardController : BaseApiController
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService) => _dashboardService = dashboardService;

    [HttpGet]
    public async Task<ActionResult> Get()
        => Ok(await _dashboardService.GetDashboardAsync(GetProfessorId()));
}

[Route("api/payments")]
public class PaymentsController : BaseApiController
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService) => _paymentService = paymentService;

    [HttpGet("by-student/{studentId}")]
    public async Task<ActionResult> GetByStudent(Guid studentId)
        => Ok(await _paymentService.GetByStudentIdAsync(studentId));

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] CreatePaymentDto dto)
    {
        var result = await _paymentService.CreateAsync(dto);
        return Created("", result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(Guid id, [FromBody] UpdatePaymentDto dto)
        => Ok(await _paymentService.UpdateAsync(id, dto));

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        await _paymentService.DeleteAsync(id);
        return NoContent();
    }
}

[Route("api/exams")]
public class ExamsController : BaseApiController
{
    private readonly IExamService _examService;

    public ExamsController(IExamService examService) => _examService = examService;

    [HttpGet("by-student/{studentId}")]
    public async Task<ActionResult> GetByStudent(Guid studentId)
        => Ok(await _examService.GetByStudentIdAsync(studentId));

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] CreateExamDto dto)
    {
        var result = await _examService.CreateAsync(dto);
        return Created("", result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(Guid id, [FromBody] UpdateExamDto dto)
        => Ok(await _examService.UpdateAsync(id, dto));

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        await _examService.DeleteAsync(id);
        return NoContent();
    }
}

[Route("api/exercises")]
public class ExercisesController : BaseApiController
{
    private readonly IExerciseService _exerciseService;

    public ExercisesController(IExerciseService exerciseService) => _exerciseService = exerciseService;

    [HttpGet("by-student/{studentId}")]
    public async Task<ActionResult> GetByStudent(Guid studentId)
        => Ok(await _exerciseService.GetByStudentIdAsync(studentId));

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] CreateExerciseDto dto)
    {
        var result = await _exerciseService.CreateAsync(dto);
        return Created("", result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(Guid id, [FromBody] UpdateExerciseDto dto)
        => Ok(await _exerciseService.UpdateAsync(id, dto));

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        await _exerciseService.DeleteAsync(id);
        return NoContent();
    }
}

[Route("api/schedule")]
public class ScheduleController : BaseApiController
{
    private readonly IScheduleService _scheduleService;

    public ScheduleController(IScheduleService scheduleService) => _scheduleService = scheduleService;

    [HttpGet]
    public async Task<ActionResult> GetAll()
        => Ok(await _scheduleService.GetByProfessorIdAsync(GetProfessorId()));

    [HttpGet("by-student/{studentId}")]
    public async Task<ActionResult> GetByStudent(Guid studentId)
        => Ok(await _scheduleService.GetByStudentIdAsync(studentId));

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] CreateScheduleDto dto)
    {
        var result = await _scheduleService.CreateAsync(GetProfessorId(), dto);
        return Created("", result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(Guid id, [FromBody] UpdateScheduleDto dto)
        => Ok(await _scheduleService.UpdateAsync(id, dto));

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        await _scheduleService.DeleteAsync(id);
        return NoContent();
    }

    [HttpPost("replicate-week")]
    public async Task<ActionResult> ReplicateWeek([FromBody] ReplicateWeekDto dto)
    {
        var count = await _scheduleService.ReplicateWeekAsync(GetProfessorId(), dto);
        return Ok(new { lessonsCreated = count });
    }
}

[Route("api/holidays")]
public class HolidaysController : BaseApiController
{
    private readonly IHolidayService _holidayService;

    public HolidaysController(IHolidayService holidayService) => _holidayService = holidayService;

    [HttpGet]
    public async Task<ActionResult> GetAll()
        => Ok(await _holidayService.GetByProfessorIdAsync(GetProfessorId()));

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] CreateHolidayDto dto)
    {
        var result = await _holidayService.CreateAsync(GetProfessorId(), dto);
        return Created("", result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(Guid id, [FromBody] UpdateHolidayDto dto)
        => Ok(await _holidayService.UpdateAsync(id, dto));

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        await _holidayService.DeleteAsync(id);
        return NoContent();
    }
}
