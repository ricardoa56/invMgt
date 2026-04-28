using Inventory.API.Common;
using Inventory.API.Filters;
using Inventory.Contract;
using Inventory.Domain;
using Inventory.Domain.Models;
using Inventory.Handlers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Inventory.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProductController : ControllerBase
    {
        private readonly ProductHandler _productHandler;

        public ProductController(InventoryDbContext context, ProductHandler productHandler)
        {
            this._productHandler = productHandler;
        }

        // GET: api/Product
        [HttpGet]
        public async Task <ActionResult<GetProductResponse>> GetAll()
        {
            var products = await _productHandler.GetAllProductsAsync();
            return products == null ? NotFound() : Ok(products);
        }

        // GET: api/Product
        [HttpGet("dd")]
        public async Task<ActionResult<GetProductDDResponse>> GetAllforDropdown()
        {
            var products = await _productHandler.GetAllProductsForDropdownAsync();
            return products == null ? NotFound() : Ok(products);
        }

        // GET: api/Product
        [HttpGet("prices")]
        public async Task<ActionResult<GetProductResponse>> GetAllNotInProductPrice()
        {
            var products = await _productHandler.GetAllNotInProductPriceAsync();
            return products == null ? NotFound() : Ok(products);
        }

        // GET: api/Product
        [HttpGet("inventory")]
        public async Task<ActionResult<GetProductResponse>> GetAllNotInProductInventory()
        {
            var products = await _productHandler.GetAllNotInProductInventoryAsync();
            return products == null ? NotFound() : Ok(products);
        }

        // GET: api/Product/{id}
        [HttpGet("{id}")]
        [ValidateId]
        public IActionResult Get(int id)
        {
            var product = _productHandler.GetProductByIdAsync(id);
            return product == null? NotFound() : Ok(product);
        }

        // POST: api/Product
        [HttpPost]
        [ValidateCategory(ValidationType.Create)]
        public async Task<ActionResult<ProductResponse>> Create([FromBody] ProductRequest product)
        {
            var prodResponse = await _productHandler.CreateProductAsync(product);
            return Ok(prodResponse);
        }

        [HttpPut("{id}")]
        [ValidateId]
        [ValidateCategory(ValidationType.Update)]
        public async Task<IActionResult> Update(int id, [FromBody] ProductRequest request)
        {
            var prodResponse = await _productHandler.UpdateProductAsync(id, request);
            return Ok(prodResponse);

        }

        [HttpDelete("{id}")]
        [ValidateId]
        [ValidateCategory(ValidationType.Update)]
        public async Task<IActionResult> Delete(int id)
        {
            var prodResponse = await _productHandler.DeleteProductAsync(id);
            return Ok(prodResponse);

        }
    }
}
