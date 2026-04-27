using Inventory.Domain.Enums;

namespace Inventory.Contract
{ 
    public class GetAllPaymentsRequest
    {
        public long? OrderId { get; set; }
        public PaymentMethod? Method { get; set; }
    }
}
