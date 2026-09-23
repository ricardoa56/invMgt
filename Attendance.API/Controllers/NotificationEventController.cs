using Attendance.API.Data;
using Attendance.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Attendance.API.Controllers;

[ApiController]
[Route("api/notification-events")]
[Authorize(Roles = "Admin,Teacher")]
public sealed class NotificationEventController(AttendanceDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<NotificationEvent>>> GetAll([FromQuery] int? sectionId) => Ok(await context.NotificationEvents.AsNoTracking().Where(item => !sectionId.HasValue || item.SectionId == null || item.SectionId == sectionId.Value).OrderByDescending(item => item.EventDate).ToListAsync());

    [HttpPost]
    public async Task<ActionResult<NotificationEvent>> Create(CreateNotificationEventRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Content))
            return BadRequest("Title and content are required.");

        var userId = int.TryParse(User.FindFirstValue("UserId"), out var identityId) ? identityId : 0;
        var teacherId = await context.Teachers.Where(teacher => teacher.UserId == userId).Select(teacher => teacher.TeacherId).FirstOrDefaultAsync();
        if (teacherId == 0) return BadRequest("The signed-in user is not linked to a teacher record.");

        if (request.SectionId.HasValue && !await context.Sections.AnyAsync(section => section.SectionId == request.SectionId.Value))
            return BadRequest("Section not found.");

        var notificationEvent = new NotificationEvent
        {
            SectionId = request.SectionId,
            CreatedByTeacherId = teacherId,
            Title = request.Title.Trim(),
            Content = request.Content.Trim(),
            EventDate = request.EventDate ?? DateTime.UtcNow
        };
        context.NotificationEvents.Add(notificationEvent);
        await context.SaveChangesAsync();
        return Ok(notificationEvent);
    }
}

public sealed record CreateNotificationEventRequest(int? SectionId, string Title, string Content, DateTime? EventDate);