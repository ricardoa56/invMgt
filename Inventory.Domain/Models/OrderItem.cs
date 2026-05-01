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
        public decimal CapitalPrice { get; set; }
        public decimal SellingPrice { get; set; }
        public Product Product { get; set; } = null!;
    }
}