using Microsoft.AspNetCore.Mvc;
using ShootMatch.Api.Contracts;
using ShootMatch.Application.Services;

namespace ShootMatch.Api.Controllers;

/// <summary>
/// OTP-based authentication for Photographers.
/// Issues JWT with role = "photographer".
///
/// POST /api/photographer-auth/otp/send
/// POST /api/photographer-auth/otp/verify
/// POST /api/photographer-auth/refresh
/// </summary>
[ApiController]
[Route("api/photographer-auth")]
public sealed class PhotographerAuthController(PhotographerAuthService authService) : ControllerBase
{
    /// <summary>Sends OTP to photographer's phone number.</summary>
    [HttpPost("otp/send")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    public async Task<IActionResult> SendOtp(
        [FromBody] PhotographerSendOtpRequest request,
        CancellationToken cancellationToken)
    {
        await authService.SendOtpAsync(request.Phone, cancellationToken);
        return Accepted();
    }

    /// <summary>
    /// Verifies OTP and returns access + refresh tokens (role = "photographer").
    /// Creates a photographer record automatically if first login.
    /// </summary>
    [HttpPost("otp/verify")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyOtp(
        [FromBody] PhotographerVerifyOtpRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var tokens = await authService.VerifyOtpAsync(request.Phone, request.OtpCode, cancellationToken);
            return Ok(tokens);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>Refreshes a photographer access token using a valid refresh token.</summary>
    [HttpPost("refresh")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Refresh(
        [FromBody] RefreshTokenRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var tokens = await authService.RefreshAsync(request.RefreshToken, cancellationToken);
            return Ok(tokens);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    // ── Email + Password ─────────────────────────────────────────────────────

    [HttpPost("register")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register(
        [FromBody] RegisterRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { error = "Email and password are required." });
        if (request.Password.Length < 8)
            return BadRequest(new { error = "Password must be at least 8 characters." });

        try
        {
            var tokens = await authService.RegisterWithEmailAsync(
                request.Email, request.Password, request.DisplayName, cancellationToken);
            return StatusCode(201, tokens);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("login")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Login(
        [FromBody] EmailLoginRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var tokens = await authService.LoginWithEmailAsync(
                request.Email, request.Password, cancellationToken);
            return Ok(tokens);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // ── Google OAuth ─────────────────────────────────────────────────────────

    [HttpPost("google")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Google(
        [FromBody] GoogleLoginRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var tokens = await authService.LoginWithGoogleAsync(request.IdToken, cancellationToken);
            return Ok(tokens);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
