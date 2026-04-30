using Inventory.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Inventory.Contract;
using Inventory.Handlers;
using InventoryDomain;
using Microsoft.EntityFrameworkCore;
using Inventory.Domain.Models;

namespace Inventory.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class InventoryController : ControllerBase
    {
        private readonly InventoryHandler _inventoryHandler;
        private readonly InventoryBalanceHandler _ibHandler;
        private readonly ProductPriceHandler _productPriceHandler;

        public InventoryController(InventoryDbContext context, InventoryHandler inventoryHandler, 
            InventoryBalanceHandler _ibHandler,
            ProductPriceHandler productPriceHandler)
        {
            this._inventoryHandler = inventoryHandler;
            this._ibHandler = _ibHandler;
            this._productPriceHandler = productPriceHandler;
        }

        [HttpGet]
        public async Task<ActionResult<GetInventoryResponse>> GetAll()
        {
            var response = await _inventoryHandler.db.InventoryBalances
                .Include(p => p.Product)
                .Select(ib => new InventoryBalanceResponse
                {
                    Id = ib.Id,
                    ProductId = ib.ProductId,
                    QuantityOnHand = ib.QuantityOnHand,
                    QuantityCommitted = ib.QuantityCommitted,
                    ProductName = ib.Product.Name,
                    SellingPrice = ib.Product.Price != null ? ib.Product.Price.SellingPrice : 0,
                }).ToListAsync();

            return Ok(response);
        }

        [HttpPost]
        public async Task<ActionResult<InventoryBalanceResponse>> CreateInventoryBalance([FromBody] InventoryBalanceRequest request)
        {
            var response = await _ibHandler.CreateInventoryBalanceAsync(request);

            return Ok(response);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<InventoryBalance?>> UpdateInventoryBalance(int id, [FromBody] InventoryBalanceRequest request)
        {
            if (!_inventoryHandler.IsProductExist(request.ProductId))
                return BadRequest($"Product with ID {request.ProductId} does not exist.");
            var response = await _ibHandler.UpdateInventoryBalanceAsync(id, request);
            return Ok(response);
        }

        [HttpPut("deduct-order")]
        public async Task<ActionResult<InventoryBalance?>> DeductAfterOrder([FromBody] InventoryOrderRequest request)
        {
            if (!_inventoryHandler.IsProductExist(request.ProductId))
                return BadRequest($"Product with ID {request.ProductId} does not exist.");
            var response = await _ibHandler.DeductAfterOrder(request);
            return Ok(response);
        }

        [HttpPut("deduct-payment")]
        public async Task<ActionResult<InventoryBalance?>> DeductAfterPayment([FromBody] InventoryBalanceRequest request)
        {
            if (!_inventoryHandler.IsProductExist(request.ProductId))
                return BadRequest($"Product with ID {request.ProductId} does not exist.");
            var response = await _ibHandler.DeductAfterPayment(request);
            return Ok(response);
        }

        [HttpPost("stock-receive")]
        public async Task<ActionResult<InventoryBalance>> StockReceive([FromBody] StockReceiveRequest request)
        {
            if (!_inventoryHandler.IsProductExist(request.ProductId))
                return BadRequest($"Product with ID {request.ProductId} does not exist.");
            var response = await _ibHandler.ReceiveStockAsync(request);
            return Ok(response);
        }

        [HttpPost("stock-adjustment")]
        public async Task<ActionResult<InventoryBalance>> AdjustStock([FromBody] StockAdjustmentRequest request)
        {
            if (!_inventoryHandler.IsProductExist(request.ProductId))
                return BadRequest($"Product with ID {request.ProductId} does not exist.");
            var response = await _ibHandler.AdjustStockAsync(request);
            return Ok(response);
        }
    }
}