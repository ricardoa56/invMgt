namespace Inventory.Contract
{
    public class OrderItemRequest
    {
        public long OrderItemId { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public int RefundedQty { get; set; }
        public string? Remarks { get; set; }
    }
}
