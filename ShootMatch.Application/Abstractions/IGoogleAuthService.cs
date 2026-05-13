namespace ShootMatch.Application.Abstractions;

/// <summary>
/// Verifies Google ID tokens and extracts user info.
/// Implemented with Google.Apis.Auth in Infrastructure.
/// </summary>
public interface IGoogleAuthService
{
    /// <summary>
    /// Validates a Google ID token (from expo-auth-session on mobile)
    /// and returns the verified user info.
    /// Throws InvalidOperationException if the token is invalid.
    /// </summary>
    Task<GoogleUserInfo> VerifyIdTokenAsync(string idToken, CancellationToken cancellationToken);
}

/// <summary>Verified user information extracted from a Google ID token.</summary>
public sealed record GoogleUserInfo(
    string GoogleId,
    string Email,
    string DisplayName,
    string? AvatarUrl);
