using Inventory.Domain.Enums;

namespace Inventory.Contract
{
    public class GetOrdersResponse
    {
        public long OrderId { get; set; }
        public string? OrderNumber { get; set; }

        public long? CustomerId { get; set; }
        public DateTime OrderDate { get; set; }

        public OrderStatus Status { get; set; }

        public decimal TotalAmount { get; set; }

        public string? Remarks { get; set; }

        public IReadOnlyCollection<OrderItemResponse> Items { get; set; } = Array.Empty<OrderItemResponse>();
    }
}
