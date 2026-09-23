using Attendance.API.Data;
using Attendance.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Attendance.API.Controllers;

[ApiController]
[Route("api/teachers")]
[Authorize]
public sealed class TeacherController(AttendanceDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Teacher>>> GetAll() => Ok(await context.Teachers.AsNoTracking().ToListAsync());

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Teacher>> Create(CreateTeacherRequest request)
    {
        if (request.UserId <= 0 || string.IsNullOrWhiteSpace(request.EmployeeNumber) || string.IsNullOrWhiteSpace(request.FullName))
            return BadRequest("UserId, full name, and employee number are required.");

        if (await context.Teachers.AnyAsync(teacher => teacher.UserId == request.UserId))
            return Conflict("This user is already linked to a teacher.");
        if (await context.Teachers.AnyAsync(teacher => teacher.EmployeeNumber == request.EmployeeNumber.Trim()))
            return Conflict("Employee number already exists.");

        var nameParts = request.FullName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var person = new Person
        {
            FirstName = nameParts.FirstOrDefault() ?? request.FullName.Trim(),
            LastName = nameParts.Length > 1 ? nameParts[^1] : request.FullName.Trim(),
            Email = request.Email
        };
        var teacher = new Teacher { UserId = request.UserId, Person = person, EmployeeNumber = request.EmployeeNumber.Trim() };
        context.Persons.Add(person);
        context.Teachers.Add(teacher);
        await context.SaveChangesAsync();
        return Ok(teacher);
    }
}

public sealed record CreateTeacherRequest(int UserId, string FullName, string Email, string EmployeeNumber);