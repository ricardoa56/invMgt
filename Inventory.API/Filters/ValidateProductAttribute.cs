using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Inventory.Domain.Models;
using Inventory.API.Helpers;
using Inventory.API.Common;

namespace Inventory.API.Filters
{
    [AttributeUsage(AttributeTargets.Method)]
    public class ValidateProductAttribute : ActionFilterAttribute
    {
        private readonly ValidationType _validationType;

        public ValidateProductAttribute(ValidationType validationType)
        {
            _validationType = validationType;
        }

        public override void OnActionExecuting(ActionExecutingContext context)
        {
            if (context.ActionArguments.TryGetValue("product", out var value) && value is Product product)
            {
                // Common validations
                if (string.IsNullOrWhiteSpace(product.Name))
                {
                    context.Result = new BadRequestObjectResult("Product name is required.");
                    return;
                }
                if (string.IsNullOrWhiteSpace(product.Description))
                {
                    context.Result = new BadRequestObjectResult("Product description is required.");
                    return;
                }

                // Context-specific validations
                if (_validationType == ValidationType.Create)
                {
                    if (!ValidationHelper.IsValidId(product.CreatedBy))
                    {
                        context.Result = new BadRequestObjectResult("CreatedBy must be a positive integer.");
                        return;
                    }
                }
                else if (_validationType == ValidationType.Update)
                {
                    if (product.ModifiedBy.HasValue && !ValidationHelper.IsValidId(product.ModifiedBy.Value))
                    {
                        context.Result = new BadRequestObjectResult("ModifiedBy must be a positive integer if provided.");
                        return;
                    }
                }
            }
        }
    }
}