using Inventory.Contract;
using Inventory.Domain;
using Inventory.Domain.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Handlers
{
    public class CustomerHandler : BaseHandler
    {
        TenantProvider _tp;

        public CustomerHandler(InventoryDbContext context, TenantProvider tp) : base(context) { _tp = tp; }

        public async Task<CustomerResponse> CreateAsync(CreateCustomerRequest request)
        {
            var entity = new Customer
            {
                Name = request.Name,
                Email = request.Email,
                MessengerId = request.MessengerId,
                MobileNo = request.MobileNo,
                CreatedDate = DateTime.UtcNow,
                Address = request.Address
            };

            this.db.Add(entity);
            await this.db.SaveChangesAsync();

            return new CustomerResponse
            {
                Id = entity.Id,
                Name = entity.Name,
                Email = entity.Email,
                MessengerId = entity.MessengerId,
                MobileNo = entity.MobileNo
            };
        }

        public async Task<CustomerResponse> UpdateCustomer(int customerId, UpdateCustomerRequest request)
        {
            var customer = await this.db.Customers.FirstOrDefaultAsync(x => x.Id == customerId);
            if (customer == null)
            {
                throw new Exception("Customer not found");
            }

            customer.Name = request.Name;
            customer.Email = request.Email;
            customer.MessengerId = request.MessengerId;
            customer.MobileNo = request.MobileNo;
            customer.Address = request.Address;

            await this.db.SaveChangesAsync();

            return new CustomerResponse
            {
                Id = customer.Id,
                Name = customer.Name,
                Email = customer.Email,
                MessengerId = customer.MessengerId,
                MobileNo = customer.MobileNo
            };
        }

        public async Task<List<CustomerResponse>> GetAllAsync()
        {
            return await this.db.Customers
                .Select(x => new CustomerResponse
                {
                    Id = x.Id,
                    Name = x.Name,
                    Email = x.Email,
                    MessengerId = x.MessengerId,
                    MobileNo = x.MobileNo,
                    Address = x.Address,
                })
                .ToListAsync();
        }
    }
}
