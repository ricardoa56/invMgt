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

        public async Task<GetProductDDResponse> GetAllProductsForDropdownAsync()
        {
            var products = await this.db.Products
                .Include(p => p.Price)
                .Select(
                p => new ProductDDResponse()
                {
                    Id = p.ProductId,
                    Name = p.Name,
                    Quantity = this.db.InventoryBalances.Where(ib => ib.ProductId == p.ProductId).Sum(ib => ib.QuantityOnHand),
                    SellingPrice = p.Price.SellingPrice
                })
                .ToListAsync();

            GetProductDDResponse response = new GetProductDDResponse()
            {
                Products = new List<ProductDDResponse>()
            };
            foreach (var product in products)
            {
                response.Products.Add(new ProductDDResponse()
                {
                    Id = product.Id,
                    Name = product.Name,
                    Quantity = product.Quantity,
                    SellingPrice = product.SellingPrice
                });
            }

            return response;
        }

        public async Task<GetProductDDResponse> GetAllNotInProductPriceAsync()
        {
            var productsInPrice = await this.db.ProductPrices.Where(pp => pp.IsActive).Select(pp => pp.ProductId).ToListAsync();
            var products = await this.db.Products
                .Where(p => !productsInPrice.Contains(p.ProductId))
                .Select(
                 p => new ProductDDResponse()
                 {
                     Id = p.ProductId,
                     Name = p.Name,
                     Quantity = this.db.InventoryBalances.Where(ib => ib.ProductId == p.ProductId).Sum(ib => ib.QuantityOnHand)
                 })
                 .ToListAsync();

            GetProductDDResponse response = new GetProductDDResponse()
            {
                Products = new List<ProductDDResponse>()
            };
            foreach (var product in products)
            {
                response.Products.Add(new ProductDDResponse()
                {
                    Id = product.Id,
                    Name = product.Name,
                    Quantity = product.Quantity
                });
            }

            return response;
        }

        public async Task<GetProductDDResponse> GetAllNotInProductInventoryAsync()
        {
            var productsInInventory = await this.db.InventoryBalances.Select(ib => ib.ProductId).ToListAsync();
            var products = await this.db.Products
                .Where(p => !productsInInventory.Contains(p.ProductId))
                .Select(
                 p => new ProductDDResponse()
                 {
                     Id = p.ProductId,
                     Name = p.Name,
                     Quantity = this.db.InventoryBalances.Where(ib => ib.ProductId == p.ProductId).Sum(ib => ib.QuantityOnHand)
                 })
                 .ToListAsync();

            GetProductDDResponse response = new GetProductDDResponse()
            {
                Products = new List<ProductDDResponse>()
            };
            foreach (var product in products)
            {
                response.Products.Add(new ProductDDResponse()
                {
                    Id = product.Id,
                    Name = product.Name,
                    Quantity = product.Quantity
                });
            }

            return response;
        }
    }
}
