namespace InventoryDomain
{
    public class StockAdjustmentItem
    {
        public int StockAdjustmentItemId { get; set; }
        public int StockAdjustmentId { get; set; }
        public int ProductId { get; set; }
        public decimal QuantityChange { get; set; } // +10 or -5
        public string ActionType { get; set; } = string.Empty; // "INCREASE" or "DECREASE"
    }
}