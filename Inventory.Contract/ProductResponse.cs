namespace Inventory.Contract
{
    public class ProductResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;
        public int CategoryId { get; set; }
        public int UnitOfMeasurementId { get; set; }
        public int CreatedBy { get; set; }

        public string ImageName { get; set; } = null!;
        public string Category { get; set; } = null!;
    }
}
