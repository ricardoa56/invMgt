using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Contract
{
    public class StockTransactionBase
    {
        public int ProductId { get; set; }
        public decimal Quantity { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public int CreatedBy { get; set; }
        public string ReferenceNumber { get; set; } = string.Empty;
        public string Remarks { get; set; } = string.Empty;
    }
}
