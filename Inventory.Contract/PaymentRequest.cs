using Inventory.Domain.Enums;

namespace Inventory.Contract
{
    public class PaymentRequest
    {
        public long OrderId { get; set; }
        public decimal Amount { get; set; }
        public string ReferenceNumber { get; set; } = string.Empty;
        public PaymentMethod Method { get; set; }
    }
}
