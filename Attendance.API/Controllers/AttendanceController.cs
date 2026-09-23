using Attendance.API.Data;
using Attendance.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Attendance.API.Controllers;

[ApiController]
[Route("api/attendance")]
[Authorize]
public sealed class AttendanceController(AttendanceDbContext context) : ControllerBase
{
    [HttpPost("scan")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<ActionResult<ScanAttendanceResponse>> Scan(ScanAttendanceRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.QrToken))
            return BadRequest("QR token is required.");

        if (request.Action is not ("Clock In" or "Clock Out"))
            return BadRequest("Action must be Clock In or Clock Out.");

        var normalizedQrToken = request.QrToken.Trim().ToUpperInvariant();
        var qrHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(normalizedQrToken)));
        var student = await context.Students.FirstOrDefaultAsync(item =>
            item.TrackingCode == normalizedQrToken || item.QrCodeHash == qrHash);
        if (student == null) return NotFound("Student QR code was not recognized.");

        var userId = int.TryParse(User.FindFirstValue("UserId"), out var identityId) ? identityId : 0;
        var teacherId = await context.Teachers
            .Where(teacher => teacher.UserId == userId)
            .Select(teacher => teacher.TeacherId)
            .FirstOrDefaultAsync();
        if (teacherId == 0)
            return BadRequest("The signed-in user is not linked to a teacher record.");

        var today = DateTime.UtcNow.Date;
        var openRecord = await context.AttendanceRecords
            .Where(record => record.StudentId == student.StudentId && record.CheckInAt.HasValue && record.CheckInAt.Value.Date == today && !record.CheckOutAt.HasValue)
            .OrderByDescending(record => record.CheckInAt)
            .FirstOrDefaultAsync();

        if (request.Action == "Clock In")
        {
            if (openRecord != null) return Conflict("The student is already clocked in.");

            var record = new AttendanceRecord
            {
                StudentId = student.StudentId,
                SectionId = student.SectionId,
                CheckInAt = DateTime.UtcNow,
                CheckInLatitude = request.Latitude,
                CheckInLongitude = request.Longitude,
                CheckInAccuracyMeters = request.AccuracyMeters,
                VerificationMethod = "QR_CODE",
                ScannedByTeacherId = teacherId,
                CreatedAt = DateTime.UtcNow
            };
            context.AttendanceRecords.Add(record);
            await context.SaveChangesAsync();
            return Ok(new ScanAttendanceResponse(student.StudentId, student.TrackingCode, "Clock In", record.CheckInAt, null));
        }

        if (openRecord == null) return Conflict("The student does not have an open attendance record.");

        openRecord.CheckOutAt = DateTime.UtcNow;
        openRecord.CheckOutLatitude = request.Latitude;
        openRecord.CheckOutLongitude = request.Longitude;
        openRecord.CheckOutAccuracyMeters = request.AccuracyMeters;
        await context.SaveChangesAsync();
        return Ok(new ScanAttendanceResponse(student.StudentId, student.TrackingCode, "Clock Out", openRecord.CheckInAt, openRecord.CheckOutAt));
    }

    [HttpGet("day")]
    public async Task<ActionResult<IEnumerable<DailyAttendanceResponse>>> GetDailyAttendance([FromQuery] DateTime? date, [FromQuery] int? sectionId)
    {
        var selectedDate = (date ?? DateTime.UtcNow).Date;

        var records = await context.AttendanceRecords
            .AsNoTracking()
            .Where(record => record.CheckInAt.HasValue
                && record.CheckInAt.Value.Date == selectedDate
                && (!sectionId.HasValue || record.SectionId == sectionId.Value))
            .Join(context.Students, record => record.StudentId, student => student.StudentId, (record, student) => new { record, student })
            .Join(context.Persons, item => item.student.PersonId, person => person.PersonId, (item, person) => new
            {
                item.record.AttendanceId,
                item.record.StudentId,
                item.student.SectionId,
                person.FirstName,
                person.MiddleName,
                person.LastName,
                item.record.CheckInAt,
                item.record.CheckOutAt
            })
            .OrderByDescending(item => item.CheckInAt)
            .ToListAsync();

        return Ok(records.Select(item => new DailyAttendanceResponse(
            item.AttendanceId,
            item.StudentId,
            string.Join(" ", new[] { item.FirstName, item.MiddleName, item.LastName }.Where(name => !string.IsNullOrWhiteSpace(name))),
            item.SectionId,
            item.CheckInAt,
            item.CheckOutAt,
            item.CheckOutAt.HasValue ? "Present" : "Checked In")));
    }

    [HttpGet("student/{studentId:int}")]
    public async Task<ActionResult<IEnumerable<AttendanceRecord>>> GetStudentAttendance(int studentId)
    {
        var records = await context.AttendanceRecords
            .AsNoTracking()
            .Where(record => record.StudentId == studentId)
            .OrderByDescending(record => record.CheckInAt)
            .ToListAsync();

        return Ok(records);
    }

    [HttpPost("clock-in")]
    public async Task<ActionResult<AttendanceRecord>> ClockIn(ClockInRequest request)
    {
        if (!await context.Students.AnyAsync(student => student.StudentId == request.StudentId))
            return NotFound("Student not found.");

        if (string.IsNullOrWhiteSpace(User.FindFirstValue("UserId")))
            return Forbid();

        var record = new AttendanceRecord
        {
            StudentId = request.StudentId,
            SectionId = request.SectionId,
            CheckInAt = DateTime.UtcNow,
            CheckInLatitude = request.Latitude,
            CheckInLongitude = request.Longitude,
            CheckInAccuracyMeters = request.AccuracyMeters,
            VerificationMethod = request.VerificationMethod,
            ScannedByTeacherId = request.TeacherId,
            CreatedAt = DateTime.UtcNow
        };

        context.AttendanceRecords.Add(record);
        await context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetStudentAttendance), new { studentId = record.StudentId }, record);
    }

    [HttpPost("{attendanceId:int}/clock-out")]
    public async Task<ActionResult<AttendanceRecord>> ClockOut(int attendanceId, ClockOutRequest request)
    {
        var record = await context.AttendanceRecords.FindAsync(attendanceId);
        if (record == null) return NotFound("Attendance record not found.");
        if (record.CheckOutAt.HasValue) return Conflict("Attendance is already clocked out.");

        record.CheckOutAt = DateTime.UtcNow;
        record.CheckOutLatitude = request.Latitude;
        record.CheckOutLongitude = request.Longitude;
        record.CheckOutAccuracyMeters = request.AccuracyMeters;
        await context.SaveChangesAsync();
        return Ok(record);
    }

    [HttpGet("section/{sectionId:int}")]
    public async Task<ActionResult<IEnumerable<AttendanceRecord>>> GetSectionAttendance(int sectionId) =>
        Ok(await context.AttendanceRecords.AsNoTracking().Where(record => record.SectionId == sectionId).OrderByDescending(record => record.CheckInAt).ToListAsync());

    [HttpPut("{attendanceId:int}")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<ActionResult<AttendanceRecord>> Correct(int attendanceId, CorrectAttendanceRequest request)
    {
        var record = await context.AttendanceRecords.FindAsync(attendanceId);
        if (record == null) return NotFound("Attendance record not found.");

        record.CheckInAt = request.CheckInAt;
        record.CheckOutAt = request.CheckOutAt;
        record.CorrectionReason = request.CorrectionReason;
        record.CorrectedAt = DateTime.UtcNow;
        record.CorrectedByTeacherId = request.CorrectedByTeacherId;
        await context.SaveChangesAsync();
        return Ok(record);
    }
}

public sealed record ClockInRequest(
    int StudentId,
    int SectionId,
    int TeacherId,
    decimal Latitude,
    decimal Longitude,
    decimal AccuracyMeters,
    string VerificationMethod);

public sealed record ClockOutRequest(decimal Latitude, decimal Longitude, decimal AccuracyMeters);
public sealed record CorrectAttendanceRequest(DateTime? CheckInAt, DateTime? CheckOutAt, int CorrectedByTeacherId, string CorrectionReason);
public sealed record DailyAttendanceResponse(int AttendanceId, int StudentId, string StudentName, int SectionId, DateTime? CheckInAt, DateTime? CheckOutAt, string Status);
public sealed record ScanAttendanceRequest(string QrToken, string Action, decimal? Latitude, decimal? Longitude, decimal? AccuracyMeters);
public sealed record ScanAttendanceResponse(int StudentId, string TrackingCode, string Action, DateTime? CheckInAt, DateTime? CheckOutAt);