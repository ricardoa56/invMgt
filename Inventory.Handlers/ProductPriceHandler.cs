using Inventory.Contract;
using Inventory.Domain;
using Inventory.Domain.Models;
using InventoryDomain;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using System.Runtime.CompilerServices;

namespace Inventory.Handlers
{
    public class ProductPriceHandler : BaseHandler
    {
        public ProductPriceHandler(InventoryDbContext context) : base(context) { }
        public async Task<ProductPrice> UpdateProductPrice(int id, int productId, decimal newSellingPrice, decimal capitalPrice = 0)
        {
            var currentPrice = await GetCurrentProductPrice(id);
            currentPrice.CapitalPrice = capitalPrice;
            currentPrice.SellingPrice = newSellingPrice;

            await this.db.SaveChangesAsync();
            return currentPrice;
        }

        public async Task<ProductPrice> GetCurrentProductPrice(int id)
        {
            var currentPrice = await this.db.ProductPrices
                .FirstOrDefaultAsync(p => p.Id == id && p.IsActive);
            if (currentPrice == null)
                throw new Exception("Active price not found for the product.");
            return currentPrice;
        }

        public async Task<ProductPrice> GetCurrentProductPriceByProductId(int productId)
        {
            var currentPrice = await this.db.ProductPrices
                .FirstOrDefaultAsync(p => p.ProductId == productId && p.IsActive);
            if (currentPrice == null)
                throw new Exception("Active price not found for the product.");
            return currentPrice;
        }

        public async Task<List<ProductPriceResponse>> GetAllProductPrice()
        {
            return await this.db.ProductPrices
                .Where(p => p.IsActive)
                .Select(p => new ProductPriceResponse // This class is your "Shield"
                {
                    Id = p.Id,
                    ProductId = p.ProductId,
                    ProductName = p.Product.Name, // Uses the link, but only grabs the string
                    CapitalPrice = p.CapitalPrice,
                    SellingPrice = p.SellingPrice,
                    CreatedAt = p.CreatedAt
                }).ToListAsync();
        }

        public async Task<bool> IsProductPriceExists(int productId) => await this.db.ProductPrices.AnyAsync(pp => pp.ProductId == productId && pp.IsActive);

        public async Task<ProductPrice> CreateProductPrice(int productId, decimal capitalPrice, decimal sellingPrice)
        {
            if(await IsProductPriceExists(productId)) throw new Exception("An active price already exists for this product.");

            var newPrice = new ProductPrice
            {
                ProductId = productId,
                CapitalPrice = capitalPrice,
                SellingPrice = sellingPrice,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            this.db.ProductPrices.Add(newPrice);
            await this.db.SaveChangesAsync();

            return newPrice;
        }
    }
}