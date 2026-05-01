using Inventory.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Contract
{
    public class GetSalesReportResponse
    {
        public long OrderId { get; set; }
        public string CustomerName { get; set; } = null!;
        public DateTime OrderDate { get; set; }
        public decimal CapitalAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal Earnings { get; set; }
        public string? Remarks { get; set; }
    }
}
