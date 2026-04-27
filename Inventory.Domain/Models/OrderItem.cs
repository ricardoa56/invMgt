using System.Text.Json.Serialization;

namespace Inventory.Domain.Models
{
    public class OrderItem
    {
        public long OrderItemId { get; set; }

        public long OrderId { get; set; }

        [JsonIgnore]
        public Order Order { get; set; } = null!;

        public int ProductId { get; set; }

        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }

        public decimal TotalPrice => Quantity * UnitPrice;
        public Product? Product { get; set; }
    }
}