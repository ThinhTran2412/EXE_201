namespace ShootMatch.Api.Contracts;

/// <summary>Register with email + password.</summary>
public sealed record RegisterRequest(
    string Email,
    string Password,
    string DisplayName,
    string OtpCode = "");

/// <summary>Login with email + password.</summary>
public sealed record EmailLoginRequest(
    string Email,
    string Password);

/// <summary>Login / register via Google ID token.</summary>
public sealed record GoogleLoginRequest(
    string IdToken);

public sealed record SendEmailOtpRequest(
    string Email);
