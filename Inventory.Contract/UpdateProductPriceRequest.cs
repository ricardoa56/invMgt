using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Contract
{
    public class UpdateProductPriceRequest
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public decimal SellingPrice { get; set; }
        public decimal CapitalPrice { get; set; } = 0;
    }
}
