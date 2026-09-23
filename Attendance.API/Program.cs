using Attendance.API.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key is required.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("Jwt:Issuer is required.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddDbContext<AttendanceDbContext>((serviceProvider, options) =>
{
    var configuration = serviceProvider.GetRequiredService<IConfiguration>();
    var httpContext = serviceProvider.GetRequiredService<IHttpContextAccessor>().HttpContext;
    var tenantDatabase = httpContext?.User.FindFirst("tenant")?.Value
        ?? httpContext?.Request.Query["tenant"].FirstOrDefault();

    if (string.IsNullOrWhiteSpace(tenantDatabase))
        throw new InvalidOperationException("No tenant database was provided. Authenticated requests need a tenant claim; public guardian requests need a tenant query parameter.");

    var connectionString = new Microsoft.Data.SqlClient.SqlConnectionStringBuilder(
        configuration.GetConnectionString("SchoolConnection"))
    {
        InitialCatalog = tenantDatabase
    }.ConnectionString;

    options.UseSqlServer(connectionString, sql => sql.EnableRetryOnFailure());
});
builder.Services.AddHttpContextAccessor();

const string corsPolicy = "AttendanceCors";
builder.Services.AddCors(options => options.AddPolicy(corsPolicy, policy => policy
    .WithOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:62675", "http://localhost:62676")
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials()));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors(corsPolicy);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

public partial class Program;