using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Aura.Application.DTOs.Subjects;
using Aura.Application.Services;
using System;
using System.Threading.Tasks;

namespace Aura.API.Controllers;

[Route("api/class-sheets")]
public class ClassSheetsController : BaseApiController
{
    private readonly IClassSheetService _classSheetService;

    public ClassSheetsController(IClassSheetService classSheetService)
    {
        _classSheetService = classSheetService;
    }

    [HttpGet("by-level/{levelId}")]
    public async Task<ActionResult> GetByLevel(Guid levelId)
        => Ok(await _classSheetService.GetByLevelIdAsync(levelId, GetProfessorId()));

    [HttpGet("{id}")]
    public async Task<ActionResult> GetById(Guid id)
        => Ok(await _classSheetService.GetByIdAsync(id, GetProfessorId()));

    [HttpGet("public/{id}")]
    [AllowAnonymous]
    [EnableRateLimiting("public")]
    public async Task<ActionResult> GetPublic(Guid id)
        => Ok(await _classSheetService.GetByIdAsync(id, null));

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] CreateClassSheetDto dto)
    {
        var result = await _classSheetService.CreateAsync(GetProfessorId(), dto);
        return Created($"/api/class-sheets/{result.Id}", result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(Guid id, [FromBody] UpdateClassSheetDto dto)
        => Ok(await _classSheetService.UpdateAsync(id, GetProfessorId(), dto));

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        await _classSheetService.DeleteAsync(id, GetProfessorId());
        return NoContent();
    }

    [HttpGet("released-to-student/{studentId}")]
    public async Task<ActionResult> GetReleased(Guid studentId)
        => Ok(await _classSheetService.GetReleasedByStudentIdAsync(studentId, GetProfessorId()));

    [HttpPost("release-to-student")]
    public async Task<ActionResult> Release([FromBody] ClassSheetStudentDto dto)
    {
        await _classSheetService.ReleaseToStudentAsync(GetProfessorId(), dto.StudentId, dto.ClassSheetId);
        return Ok();
    }

    [HttpPost("revoke-from-student")]
    public async Task<ActionResult> Revoke([FromBody] ClassSheetStudentDto dto)
    {
        await _classSheetService.RevokeFromStudentAsync(GetProfessorId(), dto.StudentId, dto.ClassSheetId);
        return Ok();
    }
}
