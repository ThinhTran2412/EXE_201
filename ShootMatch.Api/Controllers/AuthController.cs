using Microsoft.AspNetCore.Mvc;
using ShootMatch.Api.Contracts;
using ShootMatch.Application.Services;

namespace ShootMatch.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(AuthService authService) : ControllerBase
{
    // ── Phone OTP ────────────────────────────────────────────────────────────

    [HttpPost("otp/send")]
    public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest request, CancellationToken cancellationToken)
    {
        await authService.SendOtpAsync(request.Phone, cancellationToken);
        return Accepted();
    }

    [HttpPost("otp/verify")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request, CancellationToken cancellationToken)
    {
        var tokens = await authService.VerifyOtpAsync(request.Phone, request.OtpCode, cancellationToken);
        return Ok(tokens);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        var tokens = await authService.RefreshAsync(request.RefreshToken, cancellationToken);
        return Ok(tokens);
    }

    // ── Email + Password ─────────────────────────────────────────────────────

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { error = "Email and password are required." });
        if (request.Password.Length < 8)
            return BadRequest(new { error = "Password must be at least 8 characters." });

        var tokens = await authService.RegisterWithEmailAsync(
            request.Email, request.Password, request.DisplayName, cancellationToken);
        return StatusCode(201, tokens);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] EmailLoginRequest request, CancellationToken cancellationToken)
    {
        var tokens = await authService.LoginWithEmailAsync(
            request.Email, request.Password, cancellationToken);
        return Ok(tokens);
    }

    // ── Google OAuth ─────────────────────────────────────────────────────────

    [HttpPost("google")]
    public async Task<IActionResult> Google([FromBody] GoogleLoginRequest request, CancellationToken cancellationToken)
    {
        var tokens = await authService.LoginWithGoogleAsync(request.IdToken, cancellationToken);
        return Ok(tokens);
    }
}
