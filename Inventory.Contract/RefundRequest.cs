using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Contract
{
    public class RefundRequest
    {
        public int OrderId { get; set; }
        public List<OrderItemRequest> Items { get; set; } = null!;
    }
}
