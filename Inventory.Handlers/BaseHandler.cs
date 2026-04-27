using Inventory.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Handlers
{
    public class BaseHandler
    {
        InventoryDbContext _dbContext;
        public BaseHandler(InventoryDbContext context)
        {
            _dbContext = context;
        }
        public InventoryDbContext db { get { return _dbContext; } }
    }
}
