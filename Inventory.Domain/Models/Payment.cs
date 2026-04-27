using Inventory.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Domain.Models
{
    public class Payment
    {
        public long PaymentId { get; set; }
        public long OrderId { get; set; }

        public decimal Amount { get; set; }

        public PaymentMethod PaymentMethod { get; set; }
        public PaymentStatus Status { get; set; }

        public string? ReferenceNumber { get; set; }
        public int CustomerId { get; set; }

        public DateTime PaidDate { get; set; }
        public DateTime CreatedDate { get; set; }

        // Navigation property
        public Order? Order { get; set; }
    }
}
