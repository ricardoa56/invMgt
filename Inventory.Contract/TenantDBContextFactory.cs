using Inventory.Domain;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Inventory.Contract
{
    #region Multi-Tenancy Context Factory and Provider
    public class TenantProvider
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public TenantProvider(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public string? GetTenantFromToken()
        {
            var context = _httpContextAccessor.HttpContext;
            var claim = context?.User?.FindFirst("tenant");
            return claim?.Value;
        }
    }

    public interface ITenantDbContextFactory
    {
        InventoryDbContext CreateDbContext(string tenantDbName);
    }

    public class TenantDbContextFactory : ITenantDbContextFactory
    {
        private readonly IConfiguration _configuration;

        public TenantDbContextFactory(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public InventoryDbContext CreateDbContext(string tenantDbName)
        {
            // Clone your base connection string
            var baseConnection = _configuration.GetConnectionString("DefaultConnection");

            // Replace the database name (assumes `Database=` exists in string)
            var connectionString = baseConnection?.Replace("InventoryDB", tenantDbName);

            var optionsBuilder = new DbContextOptionsBuilder<InventoryDbContext>();
            optionsBuilder.UseSqlServer(connectionString);

            return new InventoryDbContext(optionsBuilder.Options);
        }
    }
    #endregion

    public interface ITestService
    {
        Guid GetId();
    }

    public class ScopedService : ITestService
    {
        private readonly Guid _id;
        public ScopedService()
        {
            _id = Guid.NewGuid();
        }
        public Guid GetId() => _id;
    }

    public class TransientService : ITestService
    {
        private readonly Guid _id;
        public TransientService()
        {
            _id = Guid.NewGuid();
        }
        public Guid GetId() => _id;
    }
}
