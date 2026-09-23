using Attendance.API.Data;
using Attendance.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Attendance.API.Controllers;

[ApiController]
[Route("api/sections")]
[Authorize]
public sealed class SectionController(AttendanceDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Section>>> GetAll() => Ok(await context.Sections.AsNoTracking().ToListAsync());

    [HttpPost]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<ActionResult<Section>> Create(CreateSectionRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.SectionName))
            return BadRequest("Section name is required.");

        var sectionName = request.SectionName.Trim();
        if (await context.Sections.AnyAsync(section => section.SectionName == sectionName))
            return Conflict("A section with that name already exists.");

        if (request.IsActive)
        {
            await context.Sections
                .Where(section => section.IsActive)
                .ExecuteUpdateAsync(setters => setters.SetProperty(section => section.IsActive, false));
        }

        var section = new Section { SectionName = sectionName, IsActive = request.IsActive };
        context.Sections.Add(section);
        await context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { sectionId = section.SectionId }, section);
    }

    [HttpPut("{sectionId:int}")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<ActionResult<Section>> Update(int sectionId, UpdateSectionRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.SectionName))
            return BadRequest("Section name is required.");

        var section = await context.Sections.FindAsync(sectionId);
        if (section == null) return NotFound();

        var sectionName = request.SectionName.Trim();
        if (await context.Sections.AnyAsync(item => item.SectionId != sectionId && item.SectionName == sectionName))
            return Conflict("A section with that name already exists.");

        if (request.IsActive)
        {
            await context.Sections
                .Where(item => item.SectionId != sectionId && item.IsActive)
                .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.IsActive, false));
        }

        section.SectionName = sectionName;
        section.IsActive = request.IsActive;
        await context.SaveChangesAsync();
        return Ok(section);
    }

    [HttpDelete("{sectionId:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int sectionId)
    {
        var section = await context.Sections.FindAsync(sectionId);
        if (section == null) return NotFound();

        if (await context.Students.AnyAsync(student => student.SectionId == sectionId))
            return Conflict("A section with students cannot be deleted.");

        context.Sections.Remove(section);
        await context.SaveChangesAsync();
        return NoContent();
    }
}

public sealed record CreateSectionRequest(string SectionName, bool IsActive = true);
public sealed record UpdateSectionRequest(string SectionName, bool IsActive = true);