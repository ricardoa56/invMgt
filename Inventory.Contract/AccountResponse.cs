namespace Inventory.Contract;

public class AccountResponse
{
    public int Id { get; set; }
    public string AccountName { get; set; } = string.Empty;
    public string? CompanyDescription { get; set; }
    public string DatabaseName { get; set; } = string.Empty;
    public string? ContactFirstName { get; set; }
    public string? ContactLastName { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? City { get; set; }
    public string? StateProvince { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
    public string RegistrationStatus { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime DateCreated { get; set; }
}