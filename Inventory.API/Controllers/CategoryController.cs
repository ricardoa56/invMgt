using Inventory.API.Filters;
using Inventory.Domain;
using Inventory.Domain.Models;
using Inventory.API.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuestPDF.Fluent;
using QuestPDF;

namespace Inventory.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CategoryController : ControllerBase
    {
        private readonly InventoryDbContext _context;

        public CategoryController(InventoryDbContext context)
        {
            _context = context;
        }

        // GET: api/Category
        [HttpGet]
        public IActionResult GetAll()
        {
            var categories = _context.Categories.ToList();
            return Ok(categories);
        }

        // GET: api/Category/{id}
        [HttpGet("{id}")]
        [ValidateId] // Validates 'id' parameter
        public IActionResult Get(int id)
        {
            var category = _context.Categories.Find(id);
            if (category == null)
                return NotFound();

            return Ok(category);
        }

        // POST: api/Category
        [HttpPost]
        [ValidateCategory(ValidationType.Create)]
        public IActionResult Create([FromBody] Category category)
        {
            category.CreatedDate = DateTime.UtcNow;
            _context.Categories.Add(category);
            _context.SaveChanges();
            return CreatedAtAction(nameof(Get), new { id = category.CategoryId }, category);
        }

        // PUT: api/Category/{id}
        [HttpPut("{id}")]
        [ValidateId] // This will validate that 'id' is a positive integer
        [ValidateCategory(ValidationType.Update)]
        public IActionResult Update(int id, [FromBody] Category updatedCategory)
        {
            var category = _context.Categories.Find(id);
            if (category == null)
                return NotFound();

            category.Name = updatedCategory.Name;
            category.Description = updatedCategory.Description;
            category.IsActive = updatedCategory.IsActive;
            category.ModifiedDate = DateTime.UtcNow;
            category.ModifiedBy = updatedCategory.ModifiedBy;

            _context.SaveChanges();
            return Ok(category);
        }

        // DELETE: api/Category/{id}
        [HttpDelete("{id}")]
        [ValidateId] // This will validate that 'id' is a positive integer
        public IActionResult Delete(int id)
        {
            var category = _context.Categories.Find(id);
            if (category == null)
                return NotFound();

            _context.Categories.Remove(category);
            _context.SaveChanges();
            return NoContent();
        }

        [HttpGet("pdf")]
        public IActionResult GetReportPdf()
        {
            QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;
            var categories = _context.Categories.ToList();

            //do data
            //totalAmount = //computation here
            var pdf = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Content().Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.ConstantColumn(50);   // ID
                            cols.RelativeColumn(2);    // Name
                            cols.RelativeColumn(3);    // Description
                            cols.ConstantColumn(80);   // Active
                            cols.ConstantColumn(90);   // Created
                        });

                        // Header
                        table.Header(h =>
                        {
                            h.Cell().Text("ID").Bold();
                            h.Cell().Text("Name").Bold();
                            h.Cell().Text("Description").Bold();
                            h.Cell().Text("Status").Bold();
                            h.Cell().Text("Created").Bold();
                        });

                        // Rows
                        foreach (var c in categories)
                        {
                            table.Cell().Text(c.CategoryId.ToString());
                            table.Cell().Text(c.Name);
                            table.Cell().Text(c.Description);
                            table.Cell().Text(c.IsActive ? "Active" : "Inactive");
                            table.Cell().Text(c.CreatedDate.ToShortDateString());
                        }
                    });
                });
            });

            var bytes = pdf.GeneratePdf();
            return File(bytes, "application/pdf", "report.pdf");
        }
    }
}