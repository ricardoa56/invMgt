using Inventory.Contract;
using Inventory.Domain;
using Inventory.Domain.Models;
using InventoryDomain;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Handlers
{
    public class InventoryBalanceHandler : BaseHandler
    {
        public InventoryBalanceHandler(InventoryDbContext context) : base(context)
        {
        }
        public async Task<InventoryBalance> CreateInventoryBalanceAsync(InventoryBalanceRequest request)
        {
            var isProductExist = await this.db.InventoryBalances.AnyAsync(ib => ib.ProductId == request.ProductId);
            if (isProductExist)
            {
                var product = await this.db.Products.FirstOrDefaultAsync(p => p.ProductId == request.ProductId);
                throw new Exception($"Product already exists {product?.Name}");
            }

            InventoryBalance invBalance = new InventoryBalance()
            {
                ProductId = request.ProductId,
                QuantityOnHand = request.QuantityOnHand
            };
            invBalance.CreatedDate = DateTime.UtcNow;
            this.db.InventoryBalances.Add(invBalance);
            await this.db.SaveChangesAsync();
            return invBalance;
        }

        public async Task<InventoryBalance?> UpdateInventoryBalanceAsync(int id, InventoryBalanceRequest request)
        {
            var invBalance = this.db.InventoryBalances.FirstOrDefault(ib => ib.Id == id) ?? throw new KeyNotFoundException($"Inventory balance with id {id} not found.");
            if (invBalance != null)
            {
                invBalance.ProductId = request.ProductId;
                invBalance.QuantityOnHand = request.QuantityOnHand;
                invBalance.QuantityCommitted = request.QuantityCommitted;
                await this.db.SaveChangesAsync();
            }
            return invBalance;
        }

        public async Task<InventoryBalance?> DeductAfterOrder(InventoryOrderRequest request)
        {
            var invBalance = this.db.InventoryBalances.FirstOrDefault(ib => ib.ProductId == request.ProductId) ?? throw new KeyNotFoundException($"Inventory balance for product id {request.ProductId} not found.");
            if (invBalance != null)
            {
                invBalance.QuantityOnHand -= request.OrderedQuantity;
                invBalance.QuantityCommitted += request.OrderedQuantity;
                await this.db.SaveChangesAsync();
            }
            return invBalance;
        }

        public async Task<InventoryBalance?> DeductAfterPayment(InventoryBalanceRequest request)
        {
            var invBalance = this.db.InventoryBalances.FirstOrDefault(ib => ib.ProductId == request.ProductId);
            if (invBalance != null)
            {
                if (invBalance.QuantityCommitted < request.QuantityCommitted)
                {
                    throw new InvalidOperationException($"Cannot deduct {request.QuantityCommitted} from committed quantity {invBalance.QuantityCommitted}.");
                }
                invBalance.QuantityCommitted -= request.QuantityCommitted;
                await this.db.SaveChangesAsync();
            }
            return invBalance;
        }

        public async Task<InventoryBalance> ReceiveStockAsync(StockReceiveRequest request)
        {
            using var transaction = await this.db.Database.BeginTransactionAsync();
            try
            {
                var invTransaction = new StockTransaction
                {
                    ProductId = request.ProductId,
                    Quantity = request.Quantity,
                    TransactionType = TransactionType.In,
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = request.CreatedBy,
                    ReferenceNumber = request.ReferenceNumber,
                    Remarks = request.Remarks
                };
                this.db.StockTransactions.Add(invTransaction);
                var invBalance = await this.db.InventoryBalances
                    .FirstOrDefaultAsync(ib => ib.ProductId == request.ProductId);

                if (invBalance == null)
                {
                    invBalance = new InventoryBalance
                    {
                        ProductId = request.ProductId,
                        QuantityOnHand = request.Quantity,
                        LastRestockDate = DateTime.UtcNow,
                    };
                    this.db.InventoryBalances.Add(invBalance);
                }
                else
                {
                    invBalance.QuantityOnHand += request.Quantity;
                    invBalance.LastRestockDate = DateTime.UtcNow;
                }

                await this.db.SaveChangesAsync();
                await transaction.CommitAsync();
                return invBalance;
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<InventoryBalance> AdjustStockAsync(StockAdjustmentRequest request)
        {
            using var transaction = await this.db.Database.BeginTransactionAsync();
            try
            {
                var invTransaction = new StockTransaction
                {
                    ProductId = request.ProductId,
                    Quantity = request.Quantity,
                    TransactionType = TransactionType.Adjustment,
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = request.CreatedBy,
                    ReferenceNumber = request.ReferenceNumber,
                    Remarks = request.Remarks
                };
                this.db.StockTransactions.Add(invTransaction);

                var invBalance = await this.db.InventoryBalances
                    .SingleAsync(ib => ib.ProductId == request.ProductId);

                invBalance.QuantityOnHand += request.Quantity;
                invBalance.ModifiedDate = DateTime.UtcNow;

                await this.db.SaveChangesAsync();
                await transaction.CommitAsync();

                return invBalance;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                throw new Exception($"Failed to adjust stock for Product ID {request.ProductId}. Ensure inventory balance exists.", ex);
            }
        }
    }
}
