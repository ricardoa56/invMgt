using Attendance.API.Data;
using Attendance.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace Attendance.API.Controllers;

[ApiController]
[Route("api/students")]
[Authorize]
public sealed class StudentController(AttendanceDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<StudentResponse>>> GetAll() => Ok(await context.Students.AsNoTracking().Join(context.Persons, student => student.PersonId, person => person.PersonId, (student, person) => new StudentResponse(student.StudentId, student.PersonId, student.SectionId, student.SchoolStudentNumber, student.TrackingCode, person.FirstName, person.MiddleName, person.LastName, person.Email, person.PhoneNumber)).ToListAsync());

    [HttpGet("{studentId:int}")]
    public async Task<ActionResult<StudentResponse>> Get(int studentId)
    {
        var student = await context.Students.AsNoTracking().Where(item => item.StudentId == studentId).Join(context.Persons, item => item.PersonId, person => person.PersonId, (item, person) => new StudentResponse(item.StudentId, item.PersonId, item.SectionId, item.SchoolStudentNumber, item.TrackingCode, person.FirstName, person.MiddleName, person.LastName, person.Email, person.PhoneNumber)).FirstOrDefaultAsync();
        return student == null ? NotFound() : Ok(student);
    }

    [HttpGet("{studentId:int}/guardian")]
    public async Task<ActionResult<StudentGuardianResponse>> GetGuardian(int studentId)
    {
        var guardian = await context.StudentGuardians
            .AsNoTracking()
            .Where(link => link.StudentId == studentId && link.IsPrimaryContact)
            .Join(context.Guardians, link => link.GuardianId, guardian => guardian.GuardianId, (link, guardian) => guardian)
            .Join(context.Persons, guardian => guardian.PersonId, person => person.PersonId, (guardian, person) => new StudentGuardianResponse(
                guardian.GuardianId,
                person.FirstName,
                person.MiddleName,
                person.LastName,
                person.Email,
                guardian.ContactNumber,
                guardian.RelationshipType))
            .FirstOrDefaultAsync();

        return guardian == null ? NotFound("No guardian is registered for this student.") : Ok(guardian);
    }

    [HttpPut("{studentId:int}/guardian")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<ActionResult<StudentGuardianResponse>> SaveGuardian(int studentId, SaveStudentGuardianRequest request)
    {
        var studentExists = await context.Students.AnyAsync(student => student.StudentId == studentId);
        if (!studentExists) return NotFound("Student not found.");
        if (string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName) || string.IsNullOrWhiteSpace(request.ContactNumber))
            return BadRequest("Guardian first name, last name, and contact number are required.");

        var existingLink = await context.StudentGuardians.FirstOrDefaultAsync(link => link.StudentId == studentId && link.IsPrimaryContact);
        Guardian guardian;
        if (existingLink == null)
        {
            var person = new Person { FirstName = request.FirstName.Trim(), MiddleName = request.MiddleName?.Trim(), LastName = request.LastName.Trim(), Email = request.Email?.Trim() };
            guardian = new Guardian { Person = person, ContactNumber = request.ContactNumber.Trim(), RelationshipType = request.RelationshipType?.Trim() };
            context.Persons.Add(person);
            context.Guardians.Add(guardian);
            await context.SaveChangesAsync();
            context.StudentGuardians.Add(new StudentGuardian { StudentId = studentId, GuardianId = guardian.GuardianId, IsPrimaryContact = true });
        }
        else
        {
            guardian = await context.Guardians.FindAsync(existingLink.GuardianId) ?? throw new InvalidOperationException("Guardian record not found.");
            var person = await context.Persons.FindAsync(guardian.PersonId) ?? throw new InvalidOperationException("Guardian person record not found.");
            person.FirstName = request.FirstName.Trim(); person.MiddleName = request.MiddleName?.Trim(); person.LastName = request.LastName.Trim(); person.Email = request.Email?.Trim();
            guardian.ContactNumber = request.ContactNumber.Trim(); guardian.RelationshipType = request.RelationshipType?.Trim();
        }

        await context.SaveChangesAsync();
        return await GetGuardian(studentId);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<ActionResult<StudentResponse>> Create(CreateStudentRequest request)
    {
        if (!await context.Sections.AnyAsync(section => section.SectionId == request.SectionId)) return BadRequest("Section not found.");
        var person = new Person { FirstName = request.FirstName, MiddleName = request.MiddleName, LastName = request.LastName, Email = request.Email, PhoneNumber = request.PhoneNumber };
        var trackingCode = await GenerateTrackingCodeAsync();
        var student = new Student
        {
            Person = person,
            SectionId = request.SectionId,
            SchoolStudentNumber = Guid.NewGuid().ToString("N"),
            TrackingCode = trackingCode,
            QrCodeHash = ComputeQrCodeHash(trackingCode)
        };
        context.Persons.Add(person);
        context.Students.Add(student);
        await context.SaveChangesAsync();
        student.SchoolStudentNumber = student.StudentId.ToString();
        await context.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { studentId = student.StudentId }, new StudentResponse(student.StudentId, person.PersonId, student.SectionId, student.SchoolStudentNumber, student.TrackingCode, person.FirstName, person.MiddleName, person.LastName, person.Email, person.PhoneNumber));
    }

    [HttpPut("{studentId:int}")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<ActionResult<StudentResponse>> Update(int studentId, UpdateStudentRequest request)
    {
        var student = await context.Students.FindAsync(studentId);
        if (student == null) return NotFound();
        var person = await context.Persons.FindAsync(student.PersonId);
        if (person == null) return NotFound("Student person record not found.");
        if (!await context.Sections.AnyAsync(section => section.SectionId == request.SectionId)) return BadRequest("Section not found.");
        person.FirstName = request.FirstName; person.MiddleName = request.MiddleName; person.LastName = request.LastName; person.Email = request.Email; person.PhoneNumber = request.PhoneNumber;
        student.SectionId = request.SectionId;
        await context.SaveChangesAsync();
        return await Get(studentId);
    }

    [HttpDelete("{studentId:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int studentId)
    {
        var student = await context.Students.FindAsync(studentId);
        if (student == null) return NotFound();
        if (await context.AttendanceRecords.AnyAsync(record => record.StudentId == studentId))
            return Conflict("A student with attendance history cannot be deleted.");

        var person = await context.Persons.FindAsync(student.PersonId);
        context.Students.Remove(student);
        if (person != null) context.Persons.Remove(person);
        await context.SaveChangesAsync();
        return NoContent();
    }

    private async Task<string> GenerateTrackingCodeAsync()
    {
        const string alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

        for (var attempt = 0; attempt < 10; attempt++)
        {
            var code = string.Create(10, alphabet, static (buffer, characters) =>
            {
                for (var index = 0; index < buffer.Length; index++)
                    buffer[index] = characters[RandomNumberGenerator.GetInt32(characters.Length)];
            });

            if (!await context.Students.AnyAsync(student => student.TrackingCode == code))
                return code;
        }

        throw new InvalidOperationException("Unable to generate a unique student tracking code.");
    }

    private static string ComputeQrCodeHash(string trackingCode) =>
        Convert.ToHexString(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(trackingCode)));
}

public sealed record CreateStudentRequest(string FirstName, string? MiddleName, string LastName, string? Email, string? PhoneNumber, int SectionId);
public sealed record UpdateStudentRequest(string FirstName, string? MiddleName, string LastName, string? Email, string? PhoneNumber, int SectionId);
public sealed record StudentResponse(int StudentId, int PersonId, int SectionId, string SchoolStudentNumber, string TrackingCode, string FirstName, string? MiddleName, string LastName, string? Email, string? PhoneNumber);
public sealed record SaveStudentGuardianRequest(string FirstName, string? MiddleName, string LastName, string? Email, string ContactNumber, string? RelationshipType);
public sealed record StudentGuardianResponse(int GuardianId, string FirstName, string? MiddleName, string LastName, string? Email, string ContactNumber, string? RelationshipType);