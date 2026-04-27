using Inventory.Contract;
using Inventory.Domain;
using Inventory.Domain.Enums;
using Inventory.Handlers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Inventory.Integration.Test;

[TestClass]
public class Inventory_OneGo_Test
{
    protected IServiceProvider ServiceProvider { get; private set; }

    [TestInitialize]
    public void Initialize()
    {
        var services = new ServiceCollection();
        services.AddLogging();        
        services.AddScoped<TenantProvider>();
        var configuration = new ConfigurationBuilder()
        .SetBasePath(Directory.GetCurrentDirectory())
        .AddJsonFile("appsettings.json", optional: true)
        .AddEnvironmentVariables()
        .Build();
        services.AddSingleton<IConfiguration>(configuration);
        services.AddScoped<InventoryDbContext>(sp => {
            var factory = sp.GetRequiredService<ITenantDbContextFactory>();
            var tenantDbName = "Account_1";
            return factory.CreateDbContext(tenantDbName);
        });

        services.AddScoped<OrderHandler>();
        services.AddScoped<InventoryHandler>();
        services.AddScoped<PaymentHandler>();
        services.AddScoped<ProductHandler>();
        services.AddScoped<TenantProvider>(sp => new TenantProvider(sp.GetRequiredService<Microsoft.AspNetCore.Http.IHttpContextAccessor>())
            );
        services.AddHttpContextAccessor();
        services.AddScoped<ITenantDbContextFactory, TenantDbContextFactory>();

        ServiceProvider = services.BuildServiceProvider();
        EnsureDatabaseCreated();
    }

    private void EnsureDatabaseCreated()
    {
        using var scope = ServiceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<InventoryDbContext>();
        context.Database.EnsureCreated();
    }

    [TestMethod]
    public async Task OrderToPaymentOneGo_AllHappyPath_ShouldSucceed()
    {
        using (var scope = ServiceProvider.CreateScope())
        {
            OrderRequest newOrder = new OrderRequest
            {
                CustomerId = 1,
                Remarks = "Test order",
                Items = new List<OrderItemRequest>
            {
                new OrderItemRequest { ProductId = 4, Quantity = 2 },
                new OrderItemRequest { ProductId = 5, Quantity = 1 }
            }
            };
            OrderHandler orderHandler = scope.ServiceProvider.GetRequiredService<OrderHandler>();
            var createdOrder = await orderHandler.CreateOrderAsync(newOrder);

            PaymentHandler paymentHandler = scope.ServiceProvider.GetRequiredService<PaymentHandler>();
            await paymentHandler.PostPaymentAsync(new PaymentRequest
            {
                OrderId = (int)createdOrder.OrderId,
                Amount = createdOrder.TotalAmount,
                Method = PaymentMethod.CreditCard,
                ReferenceNumber = "PAY123_FROM_INTEGRATION_TEST"
            });

            //Lets wait for it to process
            Task.Delay(4000).Wait();
            var confirmationPayment = await paymentHandler.GetPaymentByOrder((int)createdOrder.OrderId);

            Assert.IsTrue(createdOrder.OrderId > 0);
            Assert.AreEqual(2, createdOrder.Items.Count);
            Assert.AreEqual(createdOrder.TotalAmount, confirmationPayment.Amount);
            Assert.AreEqual("PAY123_FROM_INTEGRATION_TEST", confirmationPayment.ReferenceNumber);
            Assert.IsTrue(confirmationPayment.Status == PaymentStatus.Paid);
        }
    }
}
