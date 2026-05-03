namespace Inventory.Domain.Models
{
    public class Product
    {
        public int ProductId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public int CreatedBy { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public int? ModifiedBy { get; set; }
        public string ImageName { get; set; } = string.Empty;

        // Navigation properties
        public Category? Category { get; set; }
        public UnitOfMeasurement? UnitOfMeasurement { get; set; }

        public virtual ProductPrice? Price { get; set; }
    }
}
