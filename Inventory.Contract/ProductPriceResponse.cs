using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Contract
{
    public class ProductPriceResponse
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = null!;
        public decimal CapitalPrice { get; set; }
        public decimal SellingPrice { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
