using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Inventory.Domain.Models
{
    public class Customer
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = null!;

        [MaxLength(150)]
        public string? Email { get; set; }

        [MaxLength(100)]
        public string? MessengerId { get; set; }

        [MaxLength(50)]
        public string? MobileNo { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime? ModifiedDate { get; set; }

        [MaxLength(250)]
        public string? Address { get; set; }
    }
}
