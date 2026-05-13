namespace ShootMatch.Infrastructure.Persistence.Entities;

public sealed class OtpRecordEntry
{
    public Guid Id { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int AttemptCount { get; set; }
    public bool IsUsed { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UsedAt { get; set; }
}
