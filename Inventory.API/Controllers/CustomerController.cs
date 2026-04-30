using Inventory.Contract;
using Inventory.Domain;
using Inventory.Handlers;
using Microsoft.AspNetCore.Mvc;

namespace Inventory.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomersController : ControllerBase
    {
        private readonly CustomerHandler _customerHandler;

        public CustomersController(InventoryDbContext context, CustomerHandler customerHandler)
        {
            _customerHandler = customerHandler;
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateCustomerRequest request)
        {
            var result = await _customerHandler.CreateAsync(request);
            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _customerHandler.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetByCustomerId(int id)
        {
            var result = await _customerHandler.GetByCustomerIdAsync(id);
            return Ok(result);
        }
            

        [HttpPut("{customerId}")]
        public async Task<IActionResult> Update(int customerId, UpdateCustomerRequest request)
        {
            var result = await _customerHandler.UpdateCustomer(customerId, request);
            return Ok(result);
        }
    }
}
