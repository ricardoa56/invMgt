using Attendance.API.Data;
using Attendance.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Attendance.API.Controllers;

[ApiController]
[Route("api/guardians")]
[Authorize]
public sealed class GuardianController(AttendanceDbContext context) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("today")]
    public async Task<ActionResult<GuardianTodayAttendanceResponse>> GetTodayAttendanceByTrackingCode([FromQuery] string trackingCode)
    {
        if (string.IsNullOrWhiteSpace(trackingCode))
            return BadRequest("Tracking code is required.");

        var normalizedCode = trackingCode.Trim();

        var student = await context.Students
            .AsNoTracking()
            .Where(item => item.TrackingCode == normalizedCode)
            .Select(item => new
            {
                item.StudentId,
                item.SectionId,
                item.TrackingCode,
                item.PersonId
            })
            .FirstOrDefaultAsync();

        if (student == null)
            return NotFound("Student not found for the provided tracking code.");

        var person = await context.Persons
            .AsNoTracking()
            .Where(item => item.PersonId == student.PersonId)
            .Select(item => new { item.FirstName, item.LastName })
            .FirstOrDefaultAsync();

        var sectionName = await context.Sections
            .AsNoTracking()
            .Where(item => item.SectionId == student.SectionId)
            .Select(item => item.SectionName)
            .FirstOrDefaultAsync();

        var guardian = await context.StudentGuardians
            .AsNoTracking()
            .Where(link => link.StudentId == student.StudentId && link.IsPrimaryContact)
            .Join(context.Guardians, link => link.GuardianId, item => item.GuardianId, (link, item) => item)
            .Join(context.Persons, item => item.PersonId, person => person.PersonId, (item, person) => new GuardianSummary(
                person.FirstName,
                person.MiddleName,
                person.LastName,
                item.RelationshipType,
                item.ContactNumber,
                person.Email))
            .FirstOrDefaultAsync();

        var today = DateTime.UtcNow.Date;

        var attendanceRecords = await context.AttendanceRecords
            .AsNoTracking()
            .Where(record => record.StudentId == student.StudentId
                && record.CheckInAt.HasValue
                && record.CheckInAt.Value.Date == today)
            .OrderByDescending(record => record.CheckInAt)
            .Select(record => new GuardianAttendanceEntry(
                record.AttendanceId,
                record.CheckInAt,
                record.CheckOutAt,
                record.CheckInAt.HasValue ? record.CheckInAt.Value.ToLocalTime() : null,
                record.CheckOutAt.HasValue ? record.CheckOutAt.Value.ToLocalTime() : null,
                record.CheckOutAt.HasValue ? "Present" : "Checked In"))
            .ToListAsync();

        var events = await context.NotificationEvents
            .AsNoTracking()
            .Where(item => item.SectionId == null || item.SectionId == student.SectionId)
            .OrderByDescending(item => item.EventDate ?? DateTime.MinValue)
            .Select(item => new GuardianNotificationEntry(
                item.EventId,
                item.SectionId,
                item.Title,
                item.Content,
                item.EventDate))
            .Take(20)
            .ToListAsync();

        var response = new GuardianTodayAttendanceResponse(
            student.StudentId,
            person?.FirstName ?? string.Empty,
            person?.LastName ?? string.Empty,
            sectionName ?? string.Empty,
            student.TrackingCode,
            today,
            attendanceRecords,
            events,
            guardian);

        return Ok(response);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<GuardianResponse>>> GetAll() => Ok(await context.Guardians.AsNoTracking().Join(context.Persons, guardian => guardian.PersonId, person => person.PersonId, (guardian, person) => new GuardianResponse(guardian.GuardianId, guardian.PersonId, guardian.RelationshipType, guardian.ContactNumber, person.FirstName, person.LastName, person.Email, person.PhoneNumber)).ToListAsync());

    [HttpGet("{guardianId:int}")]
    public async Task<ActionResult<GuardianResponse>> Get(int guardianId)
    {
        var guardian = await context.Guardians.AsNoTracking().Where(item => item.GuardianId == guardianId).Join(context.Persons, item => item.PersonId, person => person.PersonId, (item, person) => new GuardianResponse(item.GuardianId, item.PersonId, item.RelationshipType, item.ContactNumber, person.FirstName, person.LastName, person.Email, person.PhoneNumber)).FirstOrDefaultAsync();
        return guardian == null ? NotFound() : Ok(guardian);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<ActionResult<GuardianResponse>> Create(CreateGuardianRequest request)
    {
        var person = new Person { FirstName = request.FirstName, LastName = request.LastName, Email = request.Email, PhoneNumber = request.PhoneNumber };
        var guardian = new Guardian { Person = person, RelationshipType = request.RelationshipType, ContactNumber = request.ContactNumber };
        context.Persons.Add(person);
        context.Guardians.Add(guardian);
        await context.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { guardianId = guardian.GuardianId }, new GuardianResponse(guardian.GuardianId, person.PersonId, guardian.RelationshipType, guardian.ContactNumber, person.FirstName, person.LastName, person.Email, person.PhoneNumber));
    }

    [HttpPut("{guardianId:int}")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<ActionResult<GuardianResponse>> Update(int guardianId, UpdateGuardianRequest request)
    {
        var guardian = await context.Guardians.FindAsync(guardianId);
        if (guardian == null) return NotFound();
        var person = await context.Persons.FindAsync(guardian.PersonId);
        if (person == null) return NotFound("Guardian person record not found.");
        person.FirstName = request.FirstName; person.LastName = request.LastName; person.Email = request.Email; person.PhoneNumber = request.PhoneNumber;
        guardian.RelationshipType = request.RelationshipType; guardian.ContactNumber = request.ContactNumber;
        await context.SaveChangesAsync();
        return await Get(guardianId);
    }

    [HttpDelete("{guardianId:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int guardianId)
    {
        var guardian = await context.Guardians.FindAsync(guardianId);
        if (guardian == null) return NotFound();
        var person = await context.Persons.FindAsync(guardian.PersonId);
        context.Guardians.Remove(guardian);
        if (person != null) context.Persons.Remove(person);
        await context.SaveChangesAsync();
        return NoContent();
    }
}

public sealed record CreateGuardianRequest(string FirstName, string LastName, string? Email, string? PhoneNumber, string? RelationshipType, string? ContactNumber);
public sealed record UpdateGuardianRequest(string FirstName, string LastName, string? Email, string? PhoneNumber, string? RelationshipType, string? ContactNumber);
public sealed record GuardianResponse(int GuardianId, int PersonId, string? RelationshipType, string? ContactNumber, string FirstName, string LastName, string? Email, string? PhoneNumber);
public sealed record GuardianAttendanceEntry(int AttendanceId, DateTime? CheckInAt, DateTime? CheckOutAt, DateTime? CheckInTime, DateTime? CheckOutTime, string Status);
public sealed record GuardianNotificationEntry(int EventId, int? SectionId, string Title, string Content, DateTime? EventDate);
public sealed record GuardianSummary(string FirstName, string? MiddleName, string LastName, string? RelationshipType, string? ContactNumber, string? Email);
public sealed record GuardianTodayAttendanceResponse(int StudentId, string FirstName, string LastName, string SectionName, string TrackingCode, DateTime AttendanceDate, IEnumerable<GuardianAttendanceEntry> AttendanceRecords, IEnumerable<GuardianNotificationEntry> Events, GuardianSummary? Guardian);