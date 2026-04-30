using Inventory.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Contract
{
    public class GetAllOrderRequest
    {
        public OrderStatus Status { get; set; }
    }
}
