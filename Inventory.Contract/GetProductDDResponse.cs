using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Contract
{
    public class GetProductDDResponse
    {
        public List<ProductDDResponse> Products { get; set; } = new List<ProductDDResponse>();
    }
}
