namespace ShootMatch.Infrastructure.Persistence.Entities;

public sealed class AppNotificationRecord
{
    public Guid Id { get; set; }
    public Guid RecipientId { get; set; }
    public string RecipientRole { get; set; } = string.Empty;
    public string Category { get; set; } = "system";
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? PayloadJson { get; set; }
    public string? ActionType { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
}
