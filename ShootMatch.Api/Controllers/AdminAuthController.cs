using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShootMatch.Application.Abstractions;
using ShootMatch.Infrastructure.Persistence;
using ShootMatch.Domain.Entities;
using ShootMatch.Api.Contracts;
using System;

namespace ShootMatch.Api.Controllers;

public record AdminLoginRequest(string Username, string Password);

[ApiController]
[Route("api/admin/auth")]
public sealed class AdminAuthController(
    IAuthTokenService authTokenService, 
    ShootMatchDbContext dbContext,
    IAuthSessionRepository authSessionRepository) : ControllerBase
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

        var accessToken = authTokenService.GenerateAccessToken(staff.Id, "staff", "admin");
        var refreshToken = authTokenService.GenerateRefreshToken();
        var refreshExpiry = DateTime.UtcNow.AddDays(14);

        await authSessionRepository.SaveAsync(new AuthSession
        {
            Id = Guid.NewGuid(),
            CustomerId = staff.Id,
            RefreshToken = refreshToken,
            ExpiresAt = refreshExpiry,
            IsRevoked = false,
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);

        return Ok(new 
        { 
            accessToken = accessToken, 
            refreshToken = refreshToken,
            expiresIn = 3600 
        });
    }

    [HttpPost("refresh")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var session = await authSessionRepository.GetByRefreshTokenAsync(request.RefreshToken, cancellationToken);
            if (session == null || session.IsRevoked || session.ExpiresAt < DateTime.UtcNow)
            {
                return BadRequest(new { error = "Refresh token expired or invalid." });
            }

            var staff = await dbContext.Staffs
                .FirstOrDefaultAsync(s => s.Id == session.CustomerId && s.Role == "admin", cancellationToken);

            if (staff == null)
            {
                return BadRequest(new { error = "Admin account not found." });
            }

            await authSessionRepository.RevokeAsync(request.RefreshToken, cancellationToken);

            var newRefreshToken = authTokenService.GenerateRefreshToken();
            var refreshExpiry = DateTime.UtcNow.AddDays(14);

            await authSessionRepository.SaveAsync(new AuthSession
            {
                Id = Guid.NewGuid(),
                CustomerId = staff.Id,
                RefreshToken = newRefreshToken,
                ExpiresAt = refreshExpiry,
                IsRevoked = false,
                CreatedAt = DateTime.UtcNow
            }, cancellationToken);

            var newAccessToken = authTokenService.GenerateAccessToken(staff.Id, "staff", "admin");

            return Ok(new
            {
                accessToken = newAccessToken,
                refreshToken = newRefreshToken,
                expiresIn = 3600
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
