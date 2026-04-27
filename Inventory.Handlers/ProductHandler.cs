using Inventory.Contract;
using Inventory.Domain;
using Inventory.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Inventory.Handlers
{
    public class ProductHandler : BaseHandler
    {
        public ProductHandler(InventoryDbContext context) : base(context) {
        }
        public async Task<Product> CreateProductAsync(ProductRequest product)
        {
            Product prod = new Product()
            {
                Description = product.Description,
                CreatedBy = product.CreatedBy,
                Name = product.Name
            };
            prod.Category = this.db.Categories.Find(product.CategoryId);
            prod.UnitOfMeasurement = this.db.UnitOfMeasurements.Find(product.UnitOfMeasurementId);
            prod.CreatedDate = DateTime.UtcNow;
            this.db.Products.Add(prod);
            await this.db.SaveChangesAsync();
            return prod;
        }

        public async Task<Product?> UpdateProductAsync(int id, ProductRequest product)
        {
            var prod = this.db.Products.Find(id);
            if (prod != null)
            {
                prod.Description = product.Description;
                prod.Name = product.Name;
                prod.Category = this.db.Categories.Find(product.CategoryId);
                prod.UnitOfMeasurement = this.db.UnitOfMeasurements.Find(product.UnitOfMeasurementId);
                await this.db.SaveChangesAsync();
            }
            return prod;
        }

        public async Task<bool> DeleteProductAsync(int id)
        {
            var prod = this.db.Products.Find(id);
            if (prod != null)
            {
                this.db.Products.Remove(prod);
                await this.db.SaveChangesAsync();
                return true;
            }
            return false;
        }

        public async Task<Product?> GetProductByIdAsync(int id)
        {
            return await this.db.Products.FindAsync(id);
        }

        public async Task<GetProductResponse> GetAllProductsAsync()
        {
            var products = await this.db.Products
                .Include(p => p.Category)
                .Include(p => p.UnitOfMeasurement)
                .ToListAsync();

            GetProductResponse response = new GetProductResponse()
            {
                Products = new List<ProductResponse>()
            };
            foreach (var product in products)
            {
                response.Products.Add(new ProductResponse()
                {
                    CategoryId = product.Category?.CategoryId ?? 1,
                    Category = product.Category?.Name ?? string.Empty,
                    CreatedBy = product.CreatedBy,
                    Description = product.Description,
                    Id = product.ProductId,
                    Name = product.Name,
                    UnitOfMeasurementId = product.UnitOfMeasurement?.UnitOfMeasurementId ?? 0,
                    ImageName = product.ImageName
                });
            }

            return response;
        }

        public async Task<GetProductResponse> GetAllNotInProductPriceAsync()
        {
            var productsInPrice = await this.db.ProductPrices.Where(pp => pp.IsActive).Select(pp => pp.ProductId).ToListAsync();
            var products = await this.db.Products
                .Include(p => p.Category)
                .Include(p => p.UnitOfMeasurement)
                .Where(p => !productsInPrice.Contains(p.ProductId))
                .ToListAsync();

            GetProductResponse response = new GetProductResponse()
            {
                Products = new List<ProductResponse>()
            };
            foreach (var product in products)
            {
                response.Products.Add(new ProductResponse()
                {
                    CategoryId = product.Category?.CategoryId ?? 1,
                    Category = product.Category?.Name ?? string.Empty,
                    CreatedBy = product.CreatedBy,
                    Description = product.Description,
                    Id = product.ProductId,
                    Name = product.Name,
                    UnitOfMeasurementId = product.UnitOfMeasurement?.UnitOfMeasurementId ?? 0,
                    ImageName = product.ImageName
                });
            }

            return response;
        }

        public async Task<GetProductResponse> GetAllNotInProductInventoryAsync()
        {
            var productsInInventory = await this.db.InventoryBalances.Select(ib => ib.ProductId).ToListAsync();
            var products = await this.db.Products
                .Include(p => p.Category)
                .Include(p => p.UnitOfMeasurement)
                .Where(p => !productsInInventory.Contains(p.ProductId))
                .ToListAsync();

            GetProductResponse response = new GetProductResponse()
            {
                Products = new List<ProductResponse>()
            };
            foreach (var product in products)
            {
                response.Products.Add(new ProductResponse()
                {
                    CategoryId = product.Category?.CategoryId ?? 1,
                    Category = product.Category?.Name ?? string.Empty,
                    CreatedBy = product.CreatedBy,
                    Description = product.Description,
                    Id = product.ProductId,
                    Name = product.Name,
                    UnitOfMeasurementId = product.UnitOfMeasurement?.UnitOfMeasurementId ?? 0,
                    ImageName = product.ImageName
                });
            }

            return response;
        }
    }
}
