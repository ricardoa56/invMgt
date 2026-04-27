using Inventory.Contract;
using Inventory.Domain;
using Inventory.Domain.Models;
using InventoryDomain;

namespace Inventory.Handlers
{
    public class InventoryHandler : BaseHandler
    {
        TenantProvider _tp;
        public InventoryHandler(InventoryDbContext context, TenantProvider tp) : base(context) { _tp = tp; }

        public bool IsProductExist(int productId)
        {
            return this.db.Products.Any(p => p.ProductId == productId);
        }
        //public async Task UpdateStockTransaction(InventoryRequest request)
        //{
        //    TransactionType tranType = request.TransactionType == 1? TransactionType.In : TransactionType.Out;
        //    await new RabbitMqPublisher().PublishInventoryAsync(request, tranType, _tp);
        //}
    }
}
