namespace ShootMatch.Domain.Entities;

public sealed class AuthSession
{
    public Guid Id { get; init; }
    public Guid CustomerId { get; init; }
    public string RefreshToken { get; init; } = string.Empty;
    public DateTime ExpiresAt { get; init; }
    public bool IsRevoked { get; init; }
    public string? UserAgent { get; init; }
    public string? IpAddress { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? RevokedAt { get; init; }
}
