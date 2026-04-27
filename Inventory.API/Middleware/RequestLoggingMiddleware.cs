using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;

    public RequestLoggingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Log the HTTP request details
        Console.WriteLine($"HTTP {context.Request.Method} {context.Request.Path}");

        await _next(context);

        // Log the HTTP response details
        Console.WriteLine($"Response Status: {context.Response.StatusCode}");
    }
}