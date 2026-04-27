namespace Inventory.Domain.Models
{
    public class ProductPriceHistory
    {
        public int ProductPriceHistoryId { get; set; }
        public decimal OldCostPrice { get; set; }
        public decimal NewCostPrice { get; set; }
        public decimal OldSellingPrice { get; set; }
        public decimal NewSellingPrice { get; set; }
        public DateTime EffectiveDate { get; set; }
        public string Remarks { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public int CreatedBy { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public int? ModifiedBy { get; set; }

        // Navigation property
        public Product? Product { get; set; }
    }
}