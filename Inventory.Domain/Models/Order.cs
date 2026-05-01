using Inventory.Domain.Enums;

namespace Inventory.Domain.Models
{
    public class Order
    {
        public long OrderId { get; set; }

        public int CustomerId { get; set; }
        public DateTime OrderDate { get; set; }

        public OrderStatus Status { get; set; }

        public decimal TotalAmount { get; set; }

        public string? Remarks { get; set; }

        public DateTime CreatedDate { get; set; }
        public int CreatedBy { get; set; }

        public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
        public List<Payment>? Payments { get; set; }
        public Customer Customer { get; set; } = null!;
    }
}
