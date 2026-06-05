using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShootMatch.Infrastructure.Persistence;

namespace ShootMatch.Api.Controllers;

[ApiController]
[Route("api/test-db")]
public class TestDbController(ShootMatchDbContext db) : ControllerBase
{
    [HttpGet("info")]
    public async Task<IActionResult> GetInfo()
    {
        var customers = await db.Customers.AsNoTracking().ToListAsync();
        var bookings = await db.Bookings.AsNoTracking().ToListAsync();
        var photographers = await db.Photographers.AsNoTracking().ToListAsync();
        var matches = await db.Matches.AsNoTracking().ToListAsync();
        return Ok(new { customers, bookings, photographers, matches });
    }

    [HttpPost("reset")]
    public async Task<IActionResult> ResetTestData()
    {
        var bookings = await db.Bookings.ToListAsync();
        db.Bookings.RemoveRange(bookings);

        var matches = await db.Matches.ToListAsync();
        foreach (var match in matches)
        {
            match.Status = "Active";
        }

        await db.SaveChangesAsync();
        return Ok(new { message = "All bookings cleared and matches reset to Active" });
    }
}
