using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Inventory.API.Helpers;

namespace Inventory.API.Filters
{
    [AttributeUsage(AttributeTargets.Method)]
    public class ValidateIdAttribute : ActionFilterAttribute
    {
        private readonly string _parameterName;

        public ValidateIdAttribute(string parameterName = "id")
        {
            _parameterName = parameterName;
        }

        public override void OnActionExecuting(ActionExecutingContext context)
        {
            if (context.ActionArguments.TryGetValue(_parameterName, out var value) && value is int id)
            {
                if (!ValidationHelper.IsValidId(id))
                {
                    context.Result = new BadRequestObjectResult($"{_parameterName} must be a positive integer.");
                }
            }
        }
    }
}