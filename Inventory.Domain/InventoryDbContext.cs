using Microsoft.EntityFrameworkCore;
using Inventory.Domain.Models;

namespace Inventory.Domain
{
    public class InventoryDbContext : DbContext
    {
        public InventoryDbContext(DbContextOptions<InventoryDbContext> options)
            : base(options) { }

        public DbSet<Account> Accounts { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<UnitOfMeasurement> UnitOfMeasurements { get; set; }
        public DbSet<Supplier> Suppliers { get; set; }
        public DbSet<StockTransaction> StockTransactions { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<ProductPriceHistory> ProductPriceHistories { get; set; }
        public DbSet<ProductPrice> ProductPrices { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Warehouse> Warehouses { get; set; }
        public DbSet<InventoryBalance> InventoryBalances { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Customer> Customers { get; set; }

        public DbSet<Payment> Payments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Product - Category (Many-to-One)
            modelBuilder.Entity<Product>()
                .HasOne(p => p.Category)
                .WithMany() // Category does not have Products collection
                .HasForeignKey("CategoryId")
                .OnDelete(DeleteBehavior.Restrict);

            // Product - UnitOfMeasurement (Many-to-One)
            modelBuilder.Entity<Product>()
                .HasOne(p => p.UnitOfMeasurement)
                .WithMany() // UnitOfMeasurement does not have Products collection
                .HasForeignKey("UnitOfMeasurementId")
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ProductPrice>()
                .HasOne(pp => pp.Product)      // The Price has a Product
                .WithOne(p => p.Price)         // The Product has a Price
                .HasForeignKey<ProductPrice>(pp => pp.ProductId) // The Foreign Key is on ProductPrice
                .OnDelete(DeleteBehavior.Cascade); // Optional: Delete price if product is deleted

            // InventoryBalance - Product (Many-to-One)
            modelBuilder.Entity<InventoryBalance>()
                .HasOne(ib => ib.Product)
                .WithMany()
                .HasForeignKey("ProductId")
                .OnDelete(DeleteBehavior.Restrict);

            // ProductPriceHistory - Product (Many-to-One)
            modelBuilder.Entity<ProductPriceHistory>()
                .HasOne(pph => pph.Product)
                .WithMany()
                .HasForeignKey("ProductId")
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasKey(o => o.OrderId);

                entity.Property(o => o.Status)
                    .IsRequired();

                entity.Property(o => o.TotalAmount)
                    .HasPrecision(18, 2);

                entity.Property(o => o.CreatedDate)
                    .HasDefaultValueSql("SYSDATETIME()");

                entity.HasMany(o => o.Items)
                      .WithOne(oi => oi.Order)
                      .HasForeignKey(oi => oi.OrderId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(o => o.Customer)
                      .WithMany()
                      .HasForeignKey(o => o.CustomerId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // PurchaseOrderItem - Product (Many-to-One)
            modelBuilder.Entity<OrderItem>()
                .HasOne(poi => poi.Product)
                .WithMany()
                .HasForeignKey("ProductId")
                .OnDelete(DeleteBehavior.Restrict);

            // StockTransaction - Product (Many-to-One)
            modelBuilder.Entity<StockTransaction>()
                .HasOne(st => st.Product)
                .WithMany()
                .HasForeignKey("ProductId")
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Payment>(entity =>
            {
                entity.HasKey(p => p.PaymentId);

                entity.Property(p => p.Amount)
                      .HasPrecision(18, 2)
                      .IsRequired();

                entity.Property(p => p.Status)
                      .HasMaxLength(50)
                      .IsRequired();

                entity.Property(p => p.CreatedDate)
                      .HasDefaultValueSql("SYSDATETIME()");

                entity.Property(p => p.PaidDate); // optional, no default

                // Relationship: Payment → Order
                entity.HasOne(p => p.Order)
                      .WithMany(o => o.Payments) // make sure Order has ICollection<Payment> Payments
                      .HasForeignKey(p => p.OrderId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ProductPrice>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasOne(d => d.Product)
                    .WithOne(p => p.Price)
                    .HasForeignKey<ProductPrice>(d => d.ProductId)
                    .OnDelete(DeleteBehavior.Cascade); // Deleting product wipes history

                entity.Property(e => e.IsActive).HasDefaultValue(true);
            });

            modelBuilder.Entity<Customer>(entity =>
            {
                entity.ToTable("Customers");

                entity.HasKey(e => e.Id);

                entity.HasIndex(e => e.Email)
                    .IsUnique()
                    .HasFilter("[Email] IS NOT NULL");

                entity.Property(e => e.CreatedDate)
                    .HasDefaultValueSql("GETDATE()");
            });

            base.OnModelCreating(modelBuilder);
        }
    }
}