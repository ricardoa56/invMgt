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
        private readonly InventoryDbContext _context;
        private readonly IConfiguration _configuration;

        public UserController(InventoryDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            // Step 1. Find tenant account using master DB (_context)
            var account = _context.Accounts
                .FirstOrDefault(a =>
                    a.AccountName == request.Account &&
                    a.IsActive);

            if (account == null)
                return Unauthorized("Account not found or inactive.");

            // Step 2. Build connection string for tenant DB
            var baseConn = new SqlConnectionStringBuilder(_configuration.GetConnectionString("DefaultConnection"))
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
                account?.DatabaseName
            });
        }


        [HttpPost("register")]
        [AllowAnonymous]
        public IActionResult Register([FromBody] RegisterUserRequest request)
        {
            if (_context.Users.Any(u => u.Username == request.Username))
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

            _context.Users.Add(user);
            _context.SaveChanges();

            return Ok(new { user.UserId, user.Username, user.FullName, user.Email, user.Role });
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

        [Authorize]
        [HttpGet("profile")]
        public IActionResult Profile()
        {
            var username = User.Identity?.Name;
            var user = _context.Users.FirstOrDefault(u => u.Username == username);
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