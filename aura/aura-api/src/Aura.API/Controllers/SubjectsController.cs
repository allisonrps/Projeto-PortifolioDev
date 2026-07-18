using Microsoft.AspNetCore.Mvc;
using Aura.Application.DTOs.Subjects;
using Aura.Application.Services;

namespace Aura.API.Controllers;

[Route("api/subjects")]
public class SubjectsController : BaseApiController
{
    private readonly ISubjectService _subjectService;

    public SubjectsController(ISubjectService subjectService) => _subjectService = subjectService;

    [HttpGet]
    public async Task<ActionResult> GetAll()
        => Ok(await _subjectService.GetByProfessorIdAsync(GetProfessorId()));

    [HttpGet("{id}")]
    public async Task<ActionResult> GetById(Guid id)
        => Ok(await _subjectService.GetByIdAsync(id, GetProfessorId()));

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] CreateSubjectDto dto)
    {
        var result = await _subjectService.CreateAsync(GetProfessorId(), dto);
        return Created($"/api/subjects/{result.Id}", result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(Guid id, [FromBody] UpdateSubjectDto dto)
        => Ok(await _subjectService.UpdateAsync(id, GetProfessorId(), dto));

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        await _subjectService.DeleteAsync(id, GetProfessorId());
        return NoContent();
    }
}

[Route("api/levels")]
public class LevelsController : BaseApiController
{
    private readonly ILevelService _levelService;

    public LevelsController(ILevelService levelService) => _levelService = levelService;

    [HttpGet("by-subject/{subjectId}")]
    public async Task<ActionResult> GetBySubject(Guid subjectId)
        => Ok(await _levelService.GetBySubjectIdAsync(subjectId));

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] CreateLevelDto dto)
    {
        var result = await _levelService.CreateAsync(dto);
        return Created($"/api/levels/{result.Id}", result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(Guid id, [FromBody] UpdateLevelDto dto)
        => Ok(await _levelService.UpdateAsync(id, dto));

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        await _levelService.DeleteAsync(id);
        return NoContent();
    }
}
