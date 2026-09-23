using Inventory.Contract;
using Inventory.Domain;
using Inventory.Domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Inventory.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AccountController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public AccountController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [HttpGet]
    public ActionResult<IEnumerable<AccountResponse>> GetAll()
    {
        using var context = CreateCentralContext();
        var accounts = context.Accounts
            .AsNoTracking()
            .OrderBy(a => a.AccountName)
            .ToList()
            .Select(ToResponse);

        return Ok(accounts);
    }

    [HttpGet("{id:int}")]
    public ActionResult<AccountResponse> Get(int id)
    {
        using var context = CreateCentralContext();
        var account = context.Accounts.AsNoTracking().FirstOrDefault(a => a.Id == id);

        return account == null ? NotFound() : Ok(ToResponse(account));
    }

    [HttpPost]
    public ActionResult<AccountResponse> Create(CreateAccountRequest request)
    {
        using var context = CreateCentralContext();

        if (context.Accounts.Any(a => a.DatabaseName == request.DatabaseName))
            return Conflict("That database is already registered.");

        if (!DatabaseExists(request.DatabaseName))
            return BadRequest("The database does not exist.");

        var account = new Account
        {
            AccountName = request.AccountName,
            CompanyDescription = request.CompanyDescription,
            DatabaseName = request.DatabaseName,
            ContactFirstName = request.ContactFirstName,
            ContactLastName = request.ContactLastName,
            ContactEmail = request.ContactEmail,
            ContactPhone = request.ContactPhone,
            AddressLine1 = request.AddressLine1,
            AddressLine2 = request.AddressLine2,
            City = request.City,
            StateProvince = request.StateProvince,
            PostalCode = request.PostalCode,
            Country = request.Country,
            RegistrationStatus = "Approved",
            IsActive = true
        };

        context.Accounts.Add(account);
        context.SaveChanges();

        return CreatedAtAction(nameof(Get), new { id = account.Id }, ToResponse(account));
    }

    [HttpPut("{id:int}")]
    public ActionResult<AccountResponse> Update(int id, UpdateAccountRequest request)
    {
        if (request.RegistrationStatus is not ("Pending" or "Approved" or "Rejected"))
            return BadRequest("RegistrationStatus must be Pending, Approved, or Rejected.");

        using var context = CreateCentralContext();
        var account = context.Accounts.FirstOrDefault(a => a.Id == id);
        if (account == null)
            return NotFound();

        account.AccountName = request.AccountName;
        account.CompanyDescription = request.CompanyDescription;
        account.ContactFirstName = request.ContactFirstName;
        account.ContactLastName = request.ContactLastName;
        account.ContactEmail = request.ContactEmail;
        account.ContactPhone = request.ContactPhone;
        account.AddressLine1 = request.AddressLine1;
        account.AddressLine2 = request.AddressLine2;
        account.City = request.City;
        account.StateProvince = request.StateProvince;
        account.PostalCode = request.PostalCode;
        account.Country = request.Country;
        account.RegistrationStatus = request.RegistrationStatus;
        account.IsActive = request.IsActive;
        context.SaveChanges();

        return Ok(ToResponse(account));
    }

    private InventoryDbContext CreateCentralContext()
    {
        var options = new DbContextOptionsBuilder<InventoryDbContext>()
            .UseSqlServer(_configuration.GetConnectionString("DefaultConnection"))
            .Options;

        return new InventoryDbContext(options);
    }

    private bool DatabaseExists(string databaseName)
    {
        var builder = new SqlConnectionStringBuilder(
            _configuration.GetConnectionString("AccountConnection"));
        builder.InitialCatalog = "master";

        try
        {
            using var connection = new SqlConnection(builder.ConnectionString);
            connection.Open();
            using var command = new SqlCommand(
                "SELECT COUNT(1) FROM sys.databases WHERE name = @databaseName", connection);
            command.Parameters.AddWithValue("@databaseName", databaseName);

            return Convert.ToInt32(command.ExecuteScalar()) == 1;
        }
        catch (SqlException)
        {
            return false;
        }
    }

    private static AccountResponse ToResponse(Account account) => new()
    {
        Id = account.Id,
        AccountName = account.AccountName,
        CompanyDescription = account.CompanyDescription,
        DatabaseName = account.DatabaseName,
        ContactFirstName = account.ContactFirstName,
        ContactLastName = account.ContactLastName,
        ContactEmail = account.ContactEmail,
        ContactPhone = account.ContactPhone,
        AddressLine1 = account.AddressLine1,
        AddressLine2 = account.AddressLine2,
        City = account.City,
        StateProvince = account.StateProvince,
        PostalCode = account.PostalCode,
        Country = account.Country,
        RegistrationStatus = account.RegistrationStatus,
        IsActive = account.IsActive,
        DateCreated = account.DateCreated
    };
}