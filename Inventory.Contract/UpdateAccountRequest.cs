using System.ComponentModel.DataAnnotations;

namespace Inventory.Contract;

public class UpdateAccountRequest
{
    [Required, MaxLength(100)]
    public string AccountName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? CompanyDescription { get; set; }

    [Required, MaxLength(100)]
    public string? ContactFirstName { get; set; }

    [Required, MaxLength(100)]
    public string? ContactLastName { get; set; }

    [Required, EmailAddress, MaxLength(256)]
    public string? ContactEmail { get; set; }

    [Required, MaxLength(30)]
    public string? ContactPhone { get; set; }

    [Required, MaxLength(150)]
    public string? AddressLine1 { get; set; }

    [MaxLength(150)]
    public string? AddressLine2 { get; set; }

    [Required, MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(100)]
    public string? StateProvince { get; set; }

    [MaxLength(20)]
    public string? PostalCode { get; set; }

    [Required, MaxLength(100)]
    public string? Country { get; set; }

    [Required, MaxLength(30)]
    public string RegistrationStatus { get; set; } = "Pending";

    public bool IsActive { get; set; } = true;
}