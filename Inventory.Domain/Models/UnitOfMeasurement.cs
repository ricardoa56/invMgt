namespace Inventory.Domain.Models
{
    public class UnitOfMeasurement
    {
        public int UnitOfMeasurementId { get; set; }
        public string Code { get; set; } = string.Empty; // e.g. "pcs", "kg", "box"
        public string Description { get; set; } = string.Empty;

        public DateTime CreatedDate { get; set; }
        public int CreatedBy { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public int? ModifiedBy { get; set; }
    }
}
