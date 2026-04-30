namespace Inventory.Contract
{
    public class OrderItemResponse
    {
        public long OrderItemId { get; set; }

        public int ProductId { get; set; }
        public string? ProductName { get; set; }
        public string? ImageName { get; set; }
        public int Quantity { get; set; }
        public decimal SellingPrice { get; set; }
        public decimal TotalPrice { get; set; }
    }
}
