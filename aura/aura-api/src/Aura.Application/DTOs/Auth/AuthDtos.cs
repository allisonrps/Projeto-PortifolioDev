using System.ComponentModel.DataAnnotations;

namespace Aura.Application.DTOs.Auth;

public class LoginRequestDto
{
    [Required(ErrorMessage = "O e-mail é obrigatório.")]
    [EmailAddress(ErrorMessage = "Informe um e-mail válido.")]
    [MaxLength(180)]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "A senha é obrigatória.")]
    [MaxLength(72)]
    public string Password { get; set; } = string.Empty;
}

public class RegisterRequestDto
{
    [Required(ErrorMessage = "O nome é obrigatório.")]
    [MinLength(2, ErrorMessage = "O nome deve ter no mínimo 2 caracteres.")]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "O e-mail é obrigatório.")]
    [EmailAddress(ErrorMessage = "Informe um e-mail válido.")]
    [MaxLength(180)]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "A senha é obrigatória.")]
    [MinLength(6, ErrorMessage = "A senha deve ter no mínimo 6 caracteres.")]
    [MaxLength(72, ErrorMessage = "A senha deve ter no máximo 72 caracteres.")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "A confirmação de senha é obrigatória.")]
    [MaxLength(72)]
    public string ConfirmPassword { get; set; } = string.Empty;
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public ProfessorResponseDto Professor { get; set; } = null!;
}

public class ProfessorResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? CpfCnpj { get; set; }
    public string? PhotoUrl { get; set; }
    public string Theme { get; set; } = "dark";
    public string PrimaryColor { get; set; } = "#7C3AED";
    public string SecondaryColor { get; set; } = "#06B6D4";
    public string PlanType { get; set; } = "trial";
    public string SubscriptionStatus { get; set; } = "trial";
    public DateTime? TrialEndsAt { get; set; }
    public DateTime? SubscriptionExpiresAt { get; set; }
    public int DaysRemaining { get; set; } = 14;
    public bool IsWriteAllowed { get; set; } = true;
    public bool IsAdmin { get; set; } = false;
    public string VisualTheme { get; set; } = "classic";
}

public class UpdateProfessorDto
{
    [MaxLength(150)]
    public string? Name { get; set; }
    [MaxLength(40)]
    public string? Phone { get; set; }
    [MaxLength(25)]
    public string? CpfCnpj { get; set; }
    [MaxLength(30)]
    public string? Theme { get; set; }
    [MaxLength(20)]
    public string? PrimaryColor { get; set; }
    [MaxLength(20)]
    public string? SecondaryColor { get; set; }
    [MaxLength(40)]
    public string? VisualTheme { get; set; }
}
