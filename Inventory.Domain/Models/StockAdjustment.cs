using InventoryDomain;

namespace Inventory.Domain.Models
{
    public class StockAdjustment
    {
        public int StockAdjustmentId { get; set; }
        public string TransactionNumber { get; set; } = string.Empty;
        public int WarehouseId { get; set; }
        public StockAdjustmentReason Reason { get; set; }
        public string Remarks { get; set; } = string.Empty;
        public DateTime AdjustmentDate { get; set; }

        public DateTime CreatedDate { get; set; }
        public int CreatedBy { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public int? ModifiedBy { get; set; }

        // Navigation property
        public Warehouse? Warehouse { get; set; }
    }
}