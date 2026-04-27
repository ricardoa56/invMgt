using InventoryDomain;

namespace Inventory.Domain.Models
{
    public class StockTransaction
    {
        public int StockTransactionId { get; set; }
        public int ProductId { get; set; }
        public int? WarehouseId { get; set; } = null;
        public decimal Quantity { get; set; }
        public TransactionType TransactionType { get; set; } 
        public string ReferenceNumber { get; set; } = string.Empty;
        public string Remarks { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public int CreatedBy { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public int? ModifiedBy { get; set; }

        // Navigation properties
        public Product? Product { get; set; }
        public Warehouse? Warehouse { get; set; }
    }
}