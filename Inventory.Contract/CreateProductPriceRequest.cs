using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Contract
{
    public class CreateProductPriceRequest
    {
        public int ProductId { get; set; }
        public decimal CapitalPrice { get; set; }
        public decimal SellingPrice { get; set; }
    }
}
