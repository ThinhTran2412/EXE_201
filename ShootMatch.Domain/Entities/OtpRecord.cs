namespace ShootMatch.Domain.Entities;

public sealed class OtpRecord
{
    public Guid Id { get; init; }
    public string Phone { get; init; } = string.Empty;
    public string Code { get; init; } = string.Empty;
    public int AttemptCount { get; init; }
    public bool IsUsed { get; init; }
    public DateTime ExpiresAt { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UsedAt { get; init; }
}
