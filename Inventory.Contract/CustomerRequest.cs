using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Contract
{
    public class CreateCustomerRequest
    {
        public string Name { get; set; } = null!;
        public string? Email { get; set; }
        public string? MessengerId { get; set; }
        public string? MobileNo { get; set; }
        public string? Address { get; set; }
    }
}
