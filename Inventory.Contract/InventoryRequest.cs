namespace Inventory.Contract
{
    public class InventoryRequest
    {
        public int ProductId { get; set; }
        public int? WarehouseId { get; set; } = null;
        public int Quantity { get; set; }
        public string ReferenceNumber { get; set; } = null!;
        public string Remarks { get; set; } = null!;

        public int TransactionType { get; set; }
    }
}
