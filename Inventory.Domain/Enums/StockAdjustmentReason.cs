namespace InventoryDomain
{
    public enum StockAdjustmentReason
    {
        DamagedItems = 1,
        InventoryCountCorrection = 2,
        ExpiredItems = 3,
        LostOrStolen = 4,
        ReceivedExtra = 5,
        ReturnedToSupplier = 6,
        TransferError = 7,
        Other = 99
    }
}