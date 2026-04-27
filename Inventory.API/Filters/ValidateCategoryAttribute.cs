using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Inventory.Domain.Models;
using Inventory.API.Helpers;
using Inventory.API.Common;

namespace Inventory.API.Filters
{
    [AttributeUsage(AttributeTargets.Method)]
    public class ValidateCategoryAttribute : ActionFilterAttribute
    {
        private readonly ValidationType _validationType;

        public ValidateCategoryAttribute(ValidationType validationType)
        {
            _validationType = validationType;
        }

        public override void OnActionExecuting(ActionExecutingContext context)
        {
            if (context.ActionArguments.TryGetValue("category", out var value) && value is Category category)
            {
                // Common validations
                if (string.IsNullOrWhiteSpace(category.Name))
                {
                    context.Result = new BadRequestObjectResult("Category name is required.");
                    return;
                }
                if (string.IsNullOrWhiteSpace(category.Description))
                {
                    context.Result = new BadRequestObjectResult("Category description is required.");
                    return;
                }

                // Context-specific validations
                if (_validationType == ValidationType.Create)
                {
                    if (!ValidationHelper.IsValidId(category.CreatedBy))
                    {
                        context.Result = new BadRequestObjectResult("CreatedBy must be a positive integer.");
                        return;
                    }
                }
                else if (_validationType == ValidationType.Update)
                {
                    if (category.ModifiedBy.HasValue && !ValidationHelper.IsValidId(category.ModifiedBy.Value))
                    {
                        context.Result = new BadRequestObjectResult("ModifiedBy must be a positive integer if provided.");
                        return;
                    }
                }
            }
        }
    }
}