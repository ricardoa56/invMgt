using Inventory.Contract;
using Inventory.Domain;
using Inventory.Domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Inventory.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly InventoryDbContext _inventoryDBContext;
        private readonly InventoryDbContext _tenantDBContext;
        private readonly IConfiguration _configuration;

        public UserController(InventoryDbContext inventoryDBContext, InventoryDbContext tenantDBContext, IConfiguration configuration)
        {
            _inventoryDBContext = inventoryDBContext;
            _tenantDBContext = tenantDBContext;
            _configuration = configuration;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            // Step 1. Find tenant account using master DB (_context)
            var connstring = _configuration.GetConnectionString("DefaultConnection");
            _tenantDBContext.Database.SetConnectionString(connstring);
            var account = _tenantDBContext.Accounts
                .FirstOrDefault(a =>
                    a.AccountName == request.Account &&
                    a.IsActive);

            if (account == null)
                return Unauthorized("Account not found or inactive.");

            // Step 2. Build connection string for tenant DB
            var baseConn = new SqlConnectionStringBuilder(_configuration.GetConnectionString("AccountConnection"))
            {
                InitialCatalog = account.DatabaseName
            };

            var tenantConnString = baseConn.ToString();

            // Step 3. Use tenant DB context to validate user
            var optionsBuilder = new DbContextOptionsBuilder<InventoryDbContext>()
                .UseSqlServer(tenantConnString);

            using var tenantContext = new InventoryDbContext(optionsBuilder.Options);

            var user = tenantContext.Users
                .FirstOrDefault(u => u.Username == request.Username && u.IsActive);

            if (user == null)
                return Unauthorized("Invalid username or password.");

            if (!VerifyPassword(request.Password, user.PasswordHash, user.PasswordSalt))
                return Unauthorized("Invalid username or password.");

            // Step 4. Generate JWT token with tenant info
            var claims = new[]
            {
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("UserId", user.UserId.ToString()),
                new Claim("tenant", account?.DatabaseName ?? string.Empty) // ✅ Add this line
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                _configuration["Jwt:Key"] ?? "your_secret_key_here"));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"] ?? "your_issuer_here",
                claims: claims,
                expires: DateTime.Now.AddHours(1),
                signingCredentials: creds);

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            return Ok(new
            {
                token = tokenString,
                user.UserId,
                user.Username,
                user.FullName,
                user.Email,
                user.Role,
                account?.DatabaseName,
                account?.AccountName,
                account?.CompanyDescription
            });
        }


        [HttpPost("register")]
        [AllowAnonymous]
        public IActionResult Register([FromBody] RegisterUserRequest request)
        {
            if (_inventoryDBContext.Users.Any(u => u.Username == request.Username))
                return BadRequest("Username already exists.");

            CreatePasswordHash(request.Password, out byte[] passwordHash, out byte[] passwordSalt);

            var user = new User
            {
                Username = request.Username,
                PasswordHash = passwordHash,
                PasswordSalt = passwordSalt,
                FullName = request.FullName,
                Email = request.Email,
                Role = request.Role,
                IsActive = true,
                CreatedDate = DateTime.UtcNow,
                CreatedBy = 1 // Or set from context
            };

            _inventoryDBContext.Users.Add(user);
            _inventoryDBContext.SaveChanges();

            return Ok(new { user.UserId, user.Username, user.FullName, user.Email, user.Role });
        }

        [HttpGet("accounts/{accountId:int}/users")]
        [Authorize(Roles = "Admin")]
        public IActionResult GetAccountUsers(int accountId)
        {
            using var centralContext = CreateContext(_configuration.GetConnectionString("DefaultConnection"));
            var account = centralContext.Accounts.FirstOrDefault(a => a.Id == accountId && a.IsActive);

            if (account == null)
                return NotFound("Account not found or inactive.");

            var tenantConnection = new SqlConnectionStringBuilder(
                _configuration.GetConnectionString("AccountConnection"))
            {
                InitialCatalog = account.DatabaseName
            }.ConnectionString;

            using var tenantContext = CreateContext(tenantConnection);
            var users = tenantContext.Users
                .AsNoTracking()
                .OrderBy(u => u.FullName)
                .Select(u => new
                {
                    u.UserId,
                    u.Username,
                    u.FullName,
                    u.Email,
                    u.Role,
                    u.IsActive
                })
                .ToList();

            return Ok(users);
        }

        [HttpPost("accounts/{accountId:int}/users")]
        [Authorize(Roles = "Admin")]
        public IActionResult CreateAccountUser(int accountId, [FromBody] CreateAccountUserRequest request)
        {
            using var centralContext = CreateContext(_configuration.GetConnectionString("DefaultConnection"));
            var account = centralContext.Accounts.FirstOrDefault(a =>
                a.Id == accountId && a.IsActive && a.RegistrationStatus == "Approved");

            if (account == null)
                return NotFound("Account not found, inactive, or not approved.");

            var tenantConnection = new SqlConnectionStringBuilder(
                _configuration.GetConnectionString("AccountConnection"))
            {
                InitialCatalog = account.DatabaseName
            }.ConnectionString;

            using var tenantContext = CreateContext(tenantConnection);

            if (tenantContext.Users.Any(u => u.Username == request.Username))
                return Conflict("Username already exists.");

            if (tenantContext.Users.Any(u => u.Email == request.Email))
                return Conflict("Email already exists.");

            CreatePasswordHash(request.Password, out byte[] passwordHash, out byte[] passwordSalt);
            var createdBy = int.TryParse(User.FindFirstValue("UserId"), out var userId) ? userId : 0;

            var user = new User
            {
                Username = request.Username,
                PasswordHash = passwordHash,
                PasswordSalt = passwordSalt,
                FullName = request.FullName,
                Email = request.Email,
                Role = request.Role,
                IsActive = true,
                CreatedDate = DateTime.UtcNow,
                CreatedBy = createdBy
            };

            tenantContext.Users.Add(user);
            tenantContext.SaveChanges();

            return Ok(new { user.UserId, user.Username, user.FullName, user.Email, user.Role });
        }

        [HttpPut("accounts/{accountId:int}/users/{userId:int}")]
        [Authorize(Roles = "Admin")]
        public IActionResult UpdateAccountUser(int accountId, int userId, [FromBody] UpdateAccountUserRequest request)
        {
            using var centralContext = CreateContext(_configuration.GetConnectionString("DefaultConnection"));
            var account = centralContext.Accounts.FirstOrDefault(a =>
                a.Id == accountId && a.IsActive && a.RegistrationStatus == "Approved");

            if (account == null)
                return NotFound("Account not found, inactive, or not approved.");

            var tenantConnection = new SqlConnectionStringBuilder(
                _configuration.GetConnectionString("AccountConnection"))
            {
                InitialCatalog = account.DatabaseName
            }.ConnectionString;

            using var tenantContext = CreateContext(tenantConnection);
            var user = tenantContext.Users.FirstOrDefault(u => u.UserId == userId);

            if (user == null)
                return NotFound("User not found.");

            if (tenantContext.Users.Any(u => u.Email == request.Email && u.UserId != userId))
                return Conflict("Email already exists.");

            user.FullName = request.FullName;
            user.Email = request.Email;
            user.Role = request.Role;
            user.IsActive = request.IsActive;
            user.ModifiedDate = DateTime.UtcNow;
            user.ModifiedBy = int.TryParse(User.FindFirstValue("UserId"), out var modifiedBy) ? modifiedBy : 0;

            if (!string.IsNullOrWhiteSpace(request.Password))
            {
                CreatePasswordHash(request.Password, out byte[] passwordHash, out byte[] passwordSalt);
                user.PasswordHash = passwordHash;
                user.PasswordSalt = passwordSalt;
            }

            tenantContext.SaveChanges();

            return Ok(new { user.UserId, user.Username, user.FullName, user.Email, user.Role, user.IsActive });
        }

        // Password hashing with salt
        private void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
        {
            using (var hmac = new HMACSHA256())
            {
                passwordSalt = hmac.Key;
                passwordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
            }
        }

        // Password verification
        private bool VerifyPassword(string password, byte[] storedHash, byte[] storedSalt)
        {
            using (var hmac = new HMACSHA256(storedSalt))
            {
                var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
                return computedHash.SequenceEqual(storedHash);
            }
        }

        private static InventoryDbContext CreateContext(string? connectionString)
        {
            var options = new DbContextOptionsBuilder<InventoryDbContext>()
                .UseSqlServer(connectionString)
                .Options;

            return new InventoryDbContext(options);
        }

        [Authorize]
        [HttpGet("profile")]
        public IActionResult Profile()
        {
            var username = User.Identity?.Name;
            var user = _inventoryDBContext.Users.FirstOrDefault(u => u.Username == username);
            if (user == null)
                return NotFound();

            return Ok(new
            {
                user.UserId,
                user.Username,
                user.FullName,
                user.Email,
                user.Role
            });
        }
    }
}