using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Contract
{
    public class InventoryBalanceResponse
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public int QuantityOnHand { get; set; }
        public int QuantityCommitted { get; set; }
        public string ProductName { get; set; } = null!;
        public decimal SellingPrice { get; set; }
    }
}
