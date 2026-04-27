using Inventory.Contract;
using Inventory.Domain;
using Inventory.Domain.Models;
using Inventory.Handlers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inventory.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PaymentController : ControllerBase
    {
        private readonly PaymentHandler _paymentHandler;

        public PaymentController(InventoryDbContext context, PaymentHandler paymentHandler)
        {
            this._paymentHandler = paymentHandler;
        }

        //Get all payments
        [HttpGet]
        public async Task<ActionResult<List<GetPaymentResponse>>> GetPayments([FromBody] GetAllPaymentsRequest request)
        {
            var payments = await _paymentHandler.GetAllPaymentAsync(request);
            return Ok(payments);
        }

        [HttpPost]
        public async Task<ActionResult<List<GetPaymentResponse>>> PostPayment([FromBody] PaymentRequest request)
        {
            GetPaymentResponse payment;
            try
            {
                payment = await _paymentHandler.PostPaymentAsync(request);
            }
            catch (Exception ex)
            {
                return BadRequest($"Invalid payment request: {ex}");
            }

            return CreatedAtAction(
                nameof(GetPayment),
                new { paymentId = payment.PaymentId },
                payment
            );
        }

        [HttpGet("{paymentId}")]
        public async Task<ActionResult<GetPaymentResponse>> GetPayment(int paymentId)
        {
            var payments = await _paymentHandler.GetPaymentAsync(paymentId);
            return Ok(payments);
        }

        [HttpGet("bycustomer/{customerId}")]
        public async Task<ActionResult<List<GetPaymentResponse>>> GetPaymentsByCustomerId(int customerId)
        {
            var payments = await _paymentHandler.GetPaymentByCustomer(customerId);
            return Ok(payments);
        }

        [HttpGet("byorder/{orderId}")]
        public async Task<ActionResult<List<GetPaymentResponse>>> GetPaymentsByOrderId(int orderId)
        {
            var payments = await _paymentHandler.GetPaymentByOrder(orderId);
            return Ok(payments);
        }
    }
}