namespace ShootMatch.Application.Contracts;

public sealed class AuthTokens
{
    public required string AccessToken { get; init; }
    public required string RefreshToken { get; init; }
    public required DateTime RefreshTokenExpiresAt { get; init; }
}
