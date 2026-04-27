using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Domain.Models
{
    public class Account
    {
        public int Id { get; set; }
        public string AccountName { get; set; } = default!;
        public string DatabaseName { get; set; } = default!;

        public bool IsActive { get; set; } = true;
        public DateTime DateCreated { get; set; } = DateTime.UtcNow;
    }
}
