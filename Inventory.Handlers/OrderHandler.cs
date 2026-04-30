using Inventory.Contract;
using Inventory.Domain;
using Inventory.Domain.Enums;
using Inventory.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Inventory.Handlers
{
    public class OrderHandler : BaseHandler
    {
        readonly TenantProvider _tp;
        public OrderHandler(InventoryDbContext context, TenantProvider tp) : base(context)
        {
            _tp = tp;
        }
        public async Task<List<GetOrdersResponse>> GetAllOrdersAsync()
        {
            var orders = await this.BuildOrderQuery(this.db.Orders).ToListAsync();
            return orders;
        }
        public async Task<List<GetOrdersOnlyResponse>> GetOrdersOnlyAsync(GetAllOrderRequest request)
        {
            var orders = await this.BuildOrdersOnlyQuery(this.db.Orders.Where(o => o.Status == request.Status)).ToListAsync();
            return orders;
        }
        public async Task<GetOrdersResponse> CreateOrderAsync(OrderRequest orderRequest)
        {
            Order order = new Order()
            {
                CustomerId = orderRequest.CustomerId,
                OrderDate = DateTime.UtcNow,
                Status = OrderStatus.Submitted,
                Remarks = orderRequest.Remarks,
                CreatedDate = DateTime.UtcNow,
                TotalAmount = orderRequest.TotalAmount,
                CreatedBy = orderRequest.CreatedBy
            };

            foreach (var orderItem in orderRequest.Items)
            {
                var ccc = await this.db.Products.ToListAsync();
                Product prod = await this.db.Products.SingleOrDefaultAsync(p => p.ProductId == orderItem.ProductId)?? throw new Exception("Product not found");
                OrderItem item = new OrderItem()
                {
                    ProductId = orderItem.ProductId,
                    Quantity = orderItem.Quantity
                };
                order.Items.Add(item);
            }
            this.db.Orders.Add(order);
            await this.db.SaveChangesAsync();
            //RabbitMqPublisher rabbitMqPublisher = new RabbitMqPublisher();

            var createdOrder = await BuildOrderQuery(this.db.Orders.Where(o => o.OrderId == order.OrderId))
                .FirstOrDefaultAsync()?? throw new Exception("Order not found");
            return createdOrder;
        }


        public async Task<GetOrdersResponse> UpdateOrderAsync(OrderRequest request)
        {
            var order = await this.db.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.OrderId == request.OrderId);

            if (order == null) throw new Exception("Order not found");

            // 1. Explicitly remove existing items from the Database context
            if (order.Items.Any())
            {
                this.db.OrderItems.RemoveRange(order.Items);
                // We clear the list so EF doesn't think these objects should be saved again
                order.Items.Clear();
            }

            // 2. Add the new items from the request
            foreach (var item in request.Items)
            {
                var prod = await this.db.Products
                    .AsNoTracking() // Use NoTracking to avoid cache conflicts
                    .SingleOrDefaultAsync(p => p.ProductId == item.ProductId);

                if (prod != null)
                {
                    order.Items.Add(new OrderItem
                    {
                        OrderId = order.OrderId, // Explicitly link it
                        ProductId = item.ProductId,
                        Quantity = item.Quantity
                    });
                }
            }

            order.TotalAmount = order.Items.Sum(i => i.Quantity * i.UnitPrice);

            // 3. Save everything in one transaction
            await this.db.SaveChangesAsync();

            var updatedOrder = await BuildOrderQuery(
                this.db.Orders.Where(o => o.OrderId == order.OrderId && o.Status != OrderStatus.Paid)
            )
            .FirstOrDefaultAsync();

            return updatedOrder ?? new GetOrdersResponse();
        }


        private IQueryable<GetOrdersResponse> BuildOrderQuery(
            IQueryable<Order> query)
        {
            return query
                .Select(o => new GetOrdersResponse
                {
                    OrderId = o.OrderId,
                    CustomerId = o.CustomerId,
                    CustomerName = o.Customer.Name,
                    OrderDate = o.OrderDate,
                    Status = o.Status,
                    Remarks = o.Remarks,
                    TotalAmount = o.TotalAmount,
                    Items = o.Items.Select(i => new OrderItemResponse
                    {
                        OrderItemId = i.OrderItemId,
                        ProductId = i.ProductId,
                        Quantity = i.Quantity,
                        UnitPrice = i.UnitPrice,
                        ProductName = i.Product.Name,
                        ImageName = i.Product.ImageName
                    }).ToList()
                });
        }

        private IQueryable<GetOrdersOnlyResponse> BuildOrdersOnlyQuery(IQueryable<Order> query)
        {
            return query
                .Select(o => new GetOrdersOnlyResponse
                {
                    OrderId = o.OrderId,
                    CustomerId = o.CustomerId,
                    OrderDate = o.OrderDate,
                    CustomerName = o.Customer.Name,
                    Status = o.Status,
                    Remarks = o.Remarks,
                    TotalAmount = o.TotalAmount
                });
        }

        public async Task<GetOrdersResponse> GetOrderAsync(int orderId)
        {
            var orderResponse = await BuildOrderQuery(
                    this.db.Orders.Where(o => o.OrderId == orderId && o.Status != OrderStatus.Paid)
                )
                .FirstOrDefaultAsync();

            return orderResponse ?? new GetOrdersResponse();
        }

        public async Task<GetOrdersResponse> GetOrderByCustomerIdAsync(int customerId)
        {
            var orderResponse = await BuildOrderQuery(
                    this.db.Orders.Where(o => o.CustomerId == customerId && o.Status != OrderStatus.Paid)
                )
                .FirstOrDefaultAsync();

            return orderResponse ?? new GetOrdersResponse();
        }
    }
}
