using Inventory.Domain.Enums;

namespace Inventory.Contract
{
    public class OrderRequest
    {
        public int CustomerId { get; set; }
        public OrderStatus Status { get; set; }
        public long OrderId { get; set; }

        public string? Remarks { get; set; }

        public List<OrderItemRequest> Items { get; set; } = new();
    }
}
