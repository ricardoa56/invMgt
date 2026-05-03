using Inventory.Contract;
using Inventory.Domain;
using Inventory.Handlers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inventory.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProductPriceController : ControllerBase
    {
        private readonly ProductPriceHandler _productPriceHandler;

        public ProductPriceController(InventoryDbContext context, ProductPriceHandler productPriceHandler)
        {
            this._productPriceHandler = productPriceHandler;
        }

        [HttpPost]
        public async Task<ActionResult<CreateProductPriceResponse>> CreateProductPrice([FromBody] CreateProductPriceRequest request)
        {
            if (await _productPriceHandler.IsProductPriceExists(request.ProductId)) return Conflict(new { message = $"An active price already exists for this product." });
            var newPrice = await _productPriceHandler.CreateProductPrice(request.ProductId, request.CapitalPrice, request.SellingPrice);
            var response = new CreateProductPriceResponse
            {
                Id = newPrice.Id,
                ProductId = newPrice.ProductId,
                CapitalPrice = newPrice.CapitalPrice,
                SellingPrice = newPrice.SellingPrice,
                CreatedAt = newPrice.CreatedAt
            };
            return Ok(response);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProductPrice(int id, [FromBody] UpdateProductPriceRequest request)
        {
            var updatedPrice = await _productPriceHandler.UpdateProductPrice(id, request.ProductId, request.SellingPrice, request.CapitalPrice);
            var response = new UpdateProductPriceResponse
            {
                Id = updatedPrice.Id,
                ProductId = updatedPrice.ProductId,
                SellingPrice = updatedPrice.SellingPrice,
                CapitalPrice = request.CapitalPrice > 0 ? request.CapitalPrice : updatedPrice.CapitalPrice
            };
            return Ok(response);
        }

        [HttpGet]
        public async Task<ActionResult<List<ProductPriceResponse>>> GetAllProductPrice()
        {
            var productPrices = await _productPriceHandler.GetAllProductPrice();
            return Ok(productPrices);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProductPriceResponse>> GetProductPriceById(int id)
        {
            var productPrice = await _productPriceHandler.GetCurrentProductPrice(id);
            if (productPrice == null)
            {
                return NotFound();
            }
            var response = new ProductPriceResponse
            {
                Id = productPrice.Id,
                ProductId = productPrice.ProductId,
                CapitalPrice = productPrice.CapitalPrice,
                SellingPrice = productPrice.SellingPrice,
                CreatedAt = productPrice.CreatedAt
            };
            return Ok(response);
        }
    }
}
