using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using Aura.Domain.Entities;
using Aura.Infrastructure.Data;
using Aura.Application.DTOs.Chat;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Aura.API.Controllers;

[Route("api/chat")]
public class ChatController : BaseApiController
{
    private readonly AuraDbContext _context;
    private readonly IMapper _mapper;

    public ChatController(AuraDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    [HttpGet("students/{studentId}")]
    public async Task<ActionResult<List<ChatMessageDto>>> GetStudentChat(Guid studentId)
    {
        var professorId = GetProfessorId();

        var student = await _context.Students
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == studentId && s.ProfessorId == professorId && !s.IsDeleted);

        if (student == null)
            return NotFound("Aluno não encontrado ou não pertence a este professor.");

        // Buscar histórico de mensagens
        var messages = await _context.ChatMessages
            .Where(m => m.StudentId == studentId && m.ProfessorId == professorId && !m.IsDeleted)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();

        // Marcar mensagens do aluno como lidas pelo professor
        var unreadFromStudent = messages
            .Where(m => m.SenderType == MessageSenderType.Student && !m.IsReadByProfessor)
            .ToList();

        if (unreadFromStudent.Any())
        {
            foreach (var msg in unreadFromStudent)
            {
                msg.IsReadByProfessor = true;
                msg.UpdatedAt = DateTime.UtcNow;
            }
            await _context.SaveChangesAsync();
        }

        var dtos = _mapper.Map<List<ChatMessageDto>>(messages);
        return Ok(dtos);
    }

    [HttpPost("students/{studentId}")]
    public async Task<ActionResult<ChatMessageDto>> SendMessageToStudent(Guid studentId, [FromBody] SendChatMessageDto dto)
    {
        var professorId = GetProfessorId();

        if (string.IsNullOrWhiteSpace(dto?.Content))
            return BadRequest("A mensagem não pode estar vazia.");

        var student = await _context.Students
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == studentId && s.ProfessorId == professorId && !s.IsDeleted);

        if (student == null)
            return NotFound("Aluno não encontrado ou não pertence a este professor.");

        var message = new ChatMessage
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            ProfessorId = professorId,
            SenderType = MessageSenderType.Professor,
            Content = dto.Content.Trim(),
            IsReadByProfessor = true,
            IsReadByStudent = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.ChatMessages.Add(message);
        await _context.SaveChangesAsync();

        var messageDto = _mapper.Map<ChatMessageDto>(message);
        return Created($"/api/chat/students/{studentId}/{message.Id}", messageDto);
    }

    [HttpGet("unread")]
    public async Task<ActionResult<List<StudentUnreadSummaryDto>>> GetUnreadMessages()
    {
        var professorId = GetProfessorId();

        var unreadMessagesRaw = await _context.ChatMessages
            .AsNoTracking()
            .Include(m => m.Student)
            .Where(m => m.ProfessorId == professorId && m.SenderType == MessageSenderType.Student && !m.IsReadByProfessor && !m.IsDeleted)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();

        var grouped = unreadMessagesRaw
            .GroupBy(m => m.StudentId)
            .Select(g => new StudentUnreadSummaryDto
            {
                StudentId = g.Key,
                StudentName = g.First().Student != null ? g.First().Student.Name : "Aluno",
                StudentPhotoUrl = g.First().Student != null ? g.First().Student.PhotoUrl : null,
                UnreadCount = g.Count(),
                LastMessageContent = g.First().Content,
                LastMessageDate = g.First().CreatedAt
            })
            .OrderByDescending(x => x.LastMessageDate)
            .ToList();

        return Ok(grouped);
    }

    [HttpDelete("messages/{messageId}")]
    public async Task<ActionResult> DeleteMessage(Guid messageId)
    {
        var professorId = GetProfessorId();

        var message = await _context.ChatMessages
            .FirstOrDefaultAsync(m => m.Id == messageId && m.ProfessorId == professorId && !m.IsDeleted);

        if (message == null)
            return NotFound("Mensagem não encontrada.");

        message.IsDeleted = true;
        message.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
