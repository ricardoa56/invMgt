using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Inventory.Domain.Models
{
    public class InventoryBalance
    {
        [Key]
        public int Id { get; set; }

        [ForeignKey("Product")]
        [Required]
        public int ProductId { get; set; }

        [Required]
        public int QuantityOnHand { get; set; }

        [Required]
        public int QuantityCommitted { get; set; }

        public DateTime? LastRestockDate { get; set; }

        // Navigation Property
        public virtual Product Product { get; set; } = null!;
        public DateTime ModifiedDate { get; set; }
        public DateTime CreatedDate { get; set; }
    }
}