using System.ComponentModel.DataAnnotations;

namespace Inventory.Contract;

public class UpdateAccountUserRequest
{
    [Required, MaxLength(256)]
    public string FullName { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Role { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    [MinLength(8)]
    public string? Password { get; set; }
}
