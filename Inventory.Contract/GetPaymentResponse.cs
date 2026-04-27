using Inventory.Domain.Enums;

namespace Inventory.Contract
{
    public class GetPaymentResponse
    {
        public long PaymentId { get; set; }

        public long OrderId { get; set; }

        public decimal? Amount { get; set; }

        public PaymentMethod? Method { get; set; }
        public string? ReferenceNumber { get; set; }

        public int PaidBy { get; set; }

        public PaymentStatus Status { get; set; }

        public DateTime CreatedDate { get; set; }
        public DateTime? PaidDate { get; set; }
    }

}
