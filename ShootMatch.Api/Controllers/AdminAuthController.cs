using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShootMatch.Application.Abstractions;
using ShootMatch.Infrastructure.Persistence;
using System;

namespace ShootMatch.Api.Controllers;

public record AdminLoginRequest(string Username, string Password);

[ApiController]
[Route("api/admin/auth")]
public sealed class AdminAuthController(IAuthTokenService authTokenService, ShootMatchDbContext dbContext) : ControllerBase
{
    [HttpPost("login")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] AdminLoginRequest request, CancellationToken cancellationToken)
    {
        var staff = await dbContext.Staffs
            .FirstOrDefaultAsync(s => s.Email == request.Username && s.Role == "admin", cancellationToken);

        if (staff == null)
        {
            return Unauthorized(new { error = "Invalid admin credentials." });
        }

        bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, staff.PasswordHash);
        if (!isPasswordValid)
        {
            return Unauthorized(new { error = "Invalid admin credentials." });
        }

        var token = authTokenService.GenerateAccessToken(staff.Id, "staff", "admin");
        return Ok(new { accessToken = token, expiresIn = 3600 });
    }
}
