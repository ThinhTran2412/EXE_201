namespace ShootMatch.Api.Contracts;

public sealed class RefreshTokenRequest
{
    public required string RefreshToken { get; init; }
}
