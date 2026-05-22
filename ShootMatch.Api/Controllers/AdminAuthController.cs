using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using ShootMatch.Application.Abstractions;
using System;

namespace ShootMatch.Api.Controllers;

public record AdminLoginRequest(string Username, string Password);

[ApiController]
[Route("api/admin/auth")]
public sealed class AdminAuthController(IAuthTokenService authTokenService, IConfiguration configuration) : ControllerBase
{
    private static readonly Guid AdminUserId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    [HttpPost("login")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult Login([FromBody] AdminLoginRequest request)
    {
        var validUsername = configuration["Admin:Username"] ?? "admin";
        var validPassword = configuration["Admin:Password"] ?? "admin123";

        if (request.Username != validUsername || request.Password != validPassword)
        {
            return Unauthorized(new { error = "Invalid admin credentials." });
        }

        var token = authTokenService.GenerateAccessToken(AdminUserId, "admin", "admin");
        return Ok(new { accessToken = token, expiresIn = 3600 });
    }
}
