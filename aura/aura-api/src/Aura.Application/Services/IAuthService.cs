using Aura.Application.DTOs.Auth;

namespace Aura.Application.Services;

public interface IAuthService
{
    Task<AuthResponseDto> LoginAsync(LoginRequestDto dto);
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto);
    Task<ProfessorResponseDto> GetProfileAsync(Guid professorId);
    Task<ProfessorResponseDto> UpdateProfileAsync(Guid professorId, UpdateProfessorDto dto);
}

public interface IFileStorageService
{
    Task<string> SaveFileAsync(Stream stream, string fileName, string folder);
    void DeleteFile(string filePath);
}
