using Inventory.Contract;
using Inventory.Domain;
using Inventory.Domain.Enums;
using Inventory.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Inventory.Handlers
{
    public class PaymentHandler : BaseHandler
    {
        TenantProvider _tp;
        public PaymentHandler(InventoryDbContext context, TenantProvider tp) : base(context)
        {
            _tp = tp;
        }
        public async Task<List<GetPaymentResponse>> GetAllPaymentAsync(GetAllPaymentsRequest request)
        {
            var query = this.db.Payments.AsQueryable();

            if (request.OrderId.HasValue)
                query = query.Where(p => p.OrderId == request.OrderId);
            
            query = query.Where(p => p.Status == PaymentStatus.Pending);

            if(request.Method.HasValue)
            query = query.Where(p => p.PaymentMethod == request.Method);

            return await this.PaymentQuery(this.db.Payments).ToListAsync() ?? throw new Exception("Payments not found");
        }

        public async Task<GetPaymentResponse> GetPaymentAsync(int paymentId)
        {
            return await this.PaymentQuery(this.db.Payments.Where(p => p.PaymentId == paymentId))
                .FirstOrDefaultAsync()?? throw new Exception("Payment not found");
        }

        public async Task<List<GetPaymentResponse>> GetPaymentByCustomer(int customerId)
        {
            return await this.PaymentQuery(this.db.Payments.Where(p => p.CustomerId == customerId))
                .ToListAsync()?? throw new Exception("Payment not found");
        }

        public async Task<GetPaymentResponse> GetPaymentByOrder(int orderId)
        {
            return await this.PaymentQuery(this.db.Payments.Where(p => p.OrderId == orderId))
                .FirstOrDefaultAsync() ?? throw new Exception("Payment not found");
        }

        private IQueryable<GetPaymentResponse> PaymentQuery(IQueryable<Payment> query)
        {
            return query
                .OrderByDescending(p => p.CreatedDate)
                .Select(p => new GetPaymentResponse
                {
                    PaymentId = p.PaymentId,
                    OrderId = p.OrderId,
                    Amount = p.Amount,
                    Method = p.PaymentMethod,
                    ReferenceNumber = p.ReferenceNumber,
                    PaidBy = p.CustomerId,
                    Status = p.Status,
                    CreatedDate = p.CreatedDate,
                    PaidDate = p.PaidDate
                });
        }

        public async Task<GetPaymentResponse> PostPaymentAsync(PaymentRequest request)
        {
            //RabbitMqPublisher publisher = new RabbitMqPublisher();
            //await publisher.PublishPaymentAsync(request.OrderId, _tp);
            //await publisher.PublishConfirmPaymentAsync(request, _tp);

            GetPaymentResponse response = new GetPaymentResponse
            {
                OrderId = request.OrderId,
                Amount = request.Amount,
                Method = request.Method,
                ReferenceNumber = request.ReferenceNumber,
                Status = PaymentStatus.Paid,
                CreatedDate = DateTime.UtcNow
            };

            return response;
        }
    }
}