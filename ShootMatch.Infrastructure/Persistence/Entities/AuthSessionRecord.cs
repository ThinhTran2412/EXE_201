namespace ShootMatch.Infrastructure.Persistence.Entities;

public sealed class AuthSessionRecord
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
    public string? UserAgent { get; set; }
    public string? IpAddress { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? RevokedAt { get; set; }
}
