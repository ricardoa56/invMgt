using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Domain.Enums
{
    public enum OrderStatus
    {
        Submitted = 0,
        Paid = 1,
        Cancelled = 2,
        Completed = 3
    }
}
