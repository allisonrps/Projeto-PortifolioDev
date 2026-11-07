using System;
using System.Threading.Tasks;
using Aura.Application.DTOs.Backup;

namespace Aura.Application.Services;

public interface IBackupService
{
    Task<BackupDto> ExportBackupAsync(Guid professorId);
    Task ImportBackupAsync(Guid professorId, BackupDto backupDto);
}
