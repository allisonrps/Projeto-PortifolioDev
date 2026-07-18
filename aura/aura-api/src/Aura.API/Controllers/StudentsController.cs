using Microsoft.AspNetCore.Mvc;
using Aura.Application.DTOs.Students;
using Aura.Application.Services;

namespace Aura.API.Controllers;

[Route("api/students")]
public class StudentsController : BaseApiController
{
    private readonly IStudentService _studentService;

    public StudentsController(IStudentService studentService) => _studentService = studentService;

    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        var result = await _studentService.GetByProfessorIdAsync(GetProfessorId());
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult> GetById(Guid id)
    {
        var result = await _studentService.GetDetailAsync(id, GetProfessorId());
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] CreateStudentDto dto)
    {
        var result = await _studentService.CreateAsync(GetProfessorId(), dto);
        return Created($"/api/students/{result.Id}", result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(Guid id, [FromBody] UpdateStudentDto dto)
    {
        var result = await _studentService.UpdateAsync(id, GetProfessorId(), dto);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        await _studentService.DeleteAsync(id, GetProfessorId());
        return NoContent();
    }

    [HttpPost("{id}/photo")]
    public async Task<ActionResult> UploadPhoto(Guid id, IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("Nenhum arquivo enviado.");
        var url = await _studentService.UploadPhotoAsync(id, GetProfessorId(), file.OpenReadStream(), file.FileName);
        return Ok(new { photoUrl = url });
    }
}
