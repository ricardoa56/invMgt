using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Contract
{
    public class StockReceiveRequest
    {
        public int ProductId { get; set; }
        public int ReceivedQuantity { get; set; }
        public DateTime ModifiedDate { get; set; } = DateTime.Now;
        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }
}
