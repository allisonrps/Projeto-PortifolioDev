using System;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Aura.Application.DTOs.Backup;
using Aura.Application.Services;

namespace Aura.API.Controllers;

[Route("api/backup")]
public class BackupController : BaseApiController
{
    private readonly IBackupService _backupService;
    private readonly ILogger<BackupController> _logger;
    private const long MaxBackupFileSizeBytes = 10 * 1024 * 1024; // 10 MB

    public BackupController(IBackupService backupService, ILogger<BackupController> logger)
    {
        _backupService = backupService;
        _logger = logger;
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        var backup = await _backupService.ExportBackupAsync(GetProfessorId());
        
        var jsonBytes = JsonSerializer.SerializeToUtf8Bytes(backup, new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        var fileName = $"aura_backup_{DateTime.Now:yyyyMMdd_HHmmss}.json";
        return File(jsonBytes, "application/json", fileName);
    }

    [HttpPost("import")]
    [RequestSizeLimit(MaxBackupFileSizeBytes)]
    public async Task<IActionResult> Import(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "Por favor, envie um arquivo de backup válido." });

        if (file.Length > MaxBackupFileSizeBytes)
            return BadRequest(new { error = "O arquivo de backup excede o limite máximo de 10 MB." });

        var ext = Path.GetExtension(file.FileName)?.ToLowerInvariant();
        if (ext != ".json")
            return BadRequest(new { error = "Apenas arquivos .json são permitidos para importação de backup." });

        try
        {
            using var stream = file.OpenReadStream();
            var backup = await JsonSerializer.DeserializeAsync<BackupDto>(stream, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                MaxDepth = 32
            });

            if (backup == null)
                return BadRequest(new { error = "O arquivo de backup está corrompido ou é inválido." });

            var professorId = GetProfessorId();
            await _backupService.ImportBackupAsync(professorId, backup);
            _logger.LogInformation("Backup importado com sucesso pelo professor {ProfessorId}.", professorId);
            return Ok(new { message = "Backup importado e restaurado com sucesso!" });
        }
        catch (JsonException)
        {
            return BadRequest(new { error = "O arquivo enviado não é um JSON de backup válido." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao restaurar backup do professor {ProfessorId}.", GetProfessorId());
            return StatusCode(500, new { error = "Erro ao restaurar o backup. Verifique se o arquivo corresponde a uma exportação oficial do Aura." });
        }
    }
}
