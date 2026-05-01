using Azure.Core;
using Inventory.Contract;
using Inventory.Domain;
using Inventory.Domain.Enums;
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
    public class OrderController : ControllerBase
    {
        private readonly OrderHandler _orderHandler;

        public OrderController(InventoryDbContext context, OrderHandler orderHandler)
        {
            this._orderHandler = orderHandler;
        }

        [HttpGet]
        public async Task<ActionResult<List<GetOrdersResponse>>> GetAll()
        {
            var orders = await _orderHandler.GetAllOrdersAsync();

            return Ok(orders);
        }

        [HttpPost]
        public async Task<ActionResult<GetOrdersResponse>> CreateOrder([FromBody] OrderRequest request)
        {
            var order = new GetOrdersResponse();
            if(request.Status != Domain.Enums.OrderStatus.Submitted) return BadRequest("Cannot update an order that has already been paid.");

            if (request.OrderId == 0)
                order = await _orderHandler.CreateOrderAsync(request);
            else
                order = await _orderHandler.UpdateOrderAsync(request);

            return CreatedAtAction(
                nameof(GetOrder),
                new { orderId = order.OrderId },
                order
            );
        }

        [HttpGet("{orderId}")]
        public async Task<ActionResult<GetOrdersResponse>> GetOrder(int orderId)
        {
            var orders = await _orderHandler.GetOrderAsync(orderId);

            return Ok(orders);
        }

        [HttpGet("bycustomer/{customerId}")]
        public async Task<ActionResult<GetOrdersResponse>> GetOrderByCustomerId(int customerId)
        {
            var orders = await _orderHandler.GetOrderByCustomerIdAsync(customerId);

            return Ok(orders);
        }

        [HttpGet("ordersonly")]
        public async Task<ActionResult<List<GetOrdersResponse>>> GetOrdersOnly([FromQuery] GetAllOrderRequest request)
        {
            var orders = await _orderHandler.GetOrdersOnlyAsync(request);

            return Ok(orders);
        }

        [HttpPut("paid/{orderId}")]
        public async Task<IActionResult> MarkAsPaid(int orderId)
        {
            var orders = await _orderHandler.MarkAsPaid(orderId);

            return Ok(orders);
        }

        [HttpGet("salesreport")]
        public async Task<IActionResult> GetSalesReport([FromQuery] GetSalesReportRequest request)
        {
            var salesReport = await _orderHandler.GetSalesReport(request.StartDate, request.EndDate);

            return Ok(salesReport);

        }
    }
}
