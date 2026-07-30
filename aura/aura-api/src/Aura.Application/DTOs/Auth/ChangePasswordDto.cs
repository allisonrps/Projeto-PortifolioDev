using System.ComponentModel.DataAnnotations;

namespace Aura.Application.DTOs.Auth;

public class ChangePasswordDto
{
    [Required(ErrorMessage = "A senha atual é obrigatória.")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "A nova senha é obrigatória.")]
    [MinLength(6, ErrorMessage = "A nova senha deve ter no mínimo 6 caracteres.")]
    public string NewPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "A confirmação da nova senha é obrigatória.")]
    public string ConfirmNewPassword { get; set; } = string.Empty;
}
