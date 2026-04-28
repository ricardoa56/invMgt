using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Contract
{
    public class ProductDDResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public decimal Quantity { get; set; }
    }
}
