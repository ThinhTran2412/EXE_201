using Microsoft.AspNetCore.Mvc;
using ShootMatch.Api.Contracts;
using ShootMatch.Application.Services;
using ShootMatch.Application.Abstractions;
using Microsoft.Extensions.Caching.Memory;

namespace ShootMatch.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(
    AuthService authService,
    IEmailService emailService,
    IMemoryCache memoryCache) : ControllerBase
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

    [HttpPost("send-email-otp")]
    public async Task<IActionResult> SendEmailOtp([FromBody] SendEmailOtpRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { error = "Email is required." });

        var random = new Random();
        var otp = random.Next(100000, 999999).ToString();

        // Cache OTP for 5 minutes
        memoryCache.Set($"otp_{request.Email}", otp, TimeSpan.FromMinutes(5));

        // Send OTP
        await emailService.SendOtpEmailAsync(request.Email, otp, cancellationToken);

        return Ok(new { message = "OTP has been sent to your email." });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { error = "Email and password are required." });
        if (request.Password.Length < 8)
            return BadRequest(new { error = "Password must be at least 8 characters." });

        // Verify OTP
        if (!memoryCache.TryGetValue($"otp_{request.Email}", out string? cachedOtp) || cachedOtp != request.OtpCode)
        {
            return BadRequest(new { error = "Mã xác thực OTP không hợp lệ hoặc đã hết hạn." });
        }

        memoryCache.Remove($"otp_{request.Email}");

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
