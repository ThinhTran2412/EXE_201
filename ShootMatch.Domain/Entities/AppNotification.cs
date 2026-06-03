namespace ShootMatch.Domain.Entities;

/// <summary>Thông báo in-app cho một tài khoản (customer hoặc photographer).</summary>
public sealed class AppNotification
{
    public Guid Id { get; init; }
    public Guid RecipientId { get; init; }
    /// <summary>customer | photographer</summary>
    public string RecipientRole { get; init; } = string.Empty;
    /// <summary>message | booking | match | call | system</summary>
    public string Category { get; init; } = "system";
    public string Title { get; init; } = string.Empty;
    public string Body { get; init; } = string.Empty;
    /// <summary>JSON: conversationId, bookingId, ...</summary>
    public string? PayloadJson { get; init; }
    /// <summary>open_conversation | open_booking | none</summary>
    public string? ActionType { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? ReadAt { get; init; }
}
