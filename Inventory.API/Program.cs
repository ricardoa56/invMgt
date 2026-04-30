using Inventory.API;
using Inventory.Handlers;
using Inventory.Domain;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Inventory.Contract;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddScoped<InventoryDbContext>(sp =>
{
    var tenantProvider = sp.GetRequiredService<TenantProvider>();
    var factory = sp.GetRequiredService<ITenantDbContextFactory>();

    var tenant = tenantProvider.GetTenantFromToken();
    var tenantDbName = string.IsNullOrEmpty(tenant) ? "InventoryDB" : tenant;

    return factory.CreateDbContext(tenantDbName);
});

builder.Services.AddScoped<ProductHandler>();
builder.Services.AddScoped<InventoryHandler>();
builder.Services.AddScoped<TenantProvider>();
builder.Services.AddScoped<OrderHandler>();
builder.Services.AddScoped<PaymentHandler>();
builder.Services.AddScoped<ProductPriceHandler>();
builder.Services.AddScoped<InventoryBalanceHandler>();
builder.Services.AddScoped<CustomerHandler>();

// JWT setup
var jwtKey = builder.Configuration["Jwt:Key"] ?? "your_secret_key_here";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "your_issuer_here";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
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



builder.Services.AddControllers();
builder.Services.AddAuthorization();

// CORS
var allowedOrigins = "AllowedOrigins";
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: allowedOrigins, policy =>
    {
        policy.WithOrigins("http://localhost:62675")
        .WithOrigins("http://localhost:5174")
        .WithOrigins("http://localhost:62676")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ITenantDbContextFactory, TenantDbContextFactory>();
builder.Services.AddScoped<TenantProvider>();

//builder.Services.AddRateLimiter(options =>
//{
//    // Option 1: Per Tenant (if token is valid)
//    options.AddPolicy("TenantRateLimit", context =>
//    {
//        var tenantProvider = context.RequestServices.GetService<TenantProvider>();
//        var tenant = tenantProvider?.GetTenantFromToken() ?? "anonymous";

//        return RateLimitPartition.GetFixedWindowLimiter(tenant, _ => new FixedWindowRateLimiterOptions
//        {
//            PermitLimit = 10,                     // allow 50 requests
//            Window = TimeSpan.FromMinutes(1),     // every 1 minute
//            QueueLimit = 10,
//            QueueProcessingOrder = QueueProcessingOrder.OldestFirst
//        });
//    });

    // Option 2: Per IP (fallback)
//    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
//    {
//        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
//        return RateLimitPartition.GetFixedWindowLimiter(ip, _ => new FixedWindowRateLimiterOptions
//        {
//            PermitLimit = 3,
//            Window = TimeSpan.FromMinutes(1)
//        });
//    });
//});

var app = builder.Build();
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(allowedOrigins);
app.UseAuthentication();
app.UseAuthorization();
//app.UseRateLimiter();
app.UseMiddleware<RequestLoggingMiddleware>();

app.MapControllers()
    .RequireRateLimiting("TenantRateLimit");
app.Run();
