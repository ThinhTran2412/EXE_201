namespace ShootMatch.Domain.Entities;

/// <summary>
/// Created automatically when a Match becomes Active (MatchCreated event).
/// Represents the messaging channel between a Customer and a Photographer.
/// Lifecycle: Active → Archived (after Booking completed) → Closed (manually or after 30 days idle).
/// </summary>
public sealed class Conversation
{
    public Guid Id { get; init; }
    public Guid MatchId { get; init; }
    public Guid CustomerId { get; init; }
    public Guid PhotographerId { get; init; }

    /// <summary>Active | Archived | Closed</summary>
    public string Status { get; init; } = "Active";

    public DateTime CreatedAt { get; init; }
    public DateTime? LastMessageAt { get; init; }

    /// <summary>Populated on inbox queries — not persisted on the conversation row.</summary>
    public string? LastMessageContent { get; init; }

    /// <summary>Populated on inbox queries — not persisted on the conversation row.</summary>
    public string? LastMessageSenderRole { get; init; }

    /// <summary>Populated on inbox queries — not persisted on the conversation row.</summary>
    public string? LastMessageSenderName { get; init; }

    /// <summary>Populated on inbox queries — not persisted on the conversation row.</summary>
    public int UnreadCount { get; init; }

    /// <summary>Populated on inbox queries — not persisted on the conversation row.</summary>
    public string? CustomerDisplayName { get; init; }

    /// <summary>Populated on inbox queries — not persisted on the conversation row.</summary>
    public string? PhotographerDisplayName { get; init; }

    /// <summary>Populated on inbox queries — not persisted on the conversation row.</summary>
    public string? CustomerAvatarUrl { get; init; }

    /// <summary>Populated on inbox queries — not persisted on the conversation row.</summary>
    public string? PhotographerAvatarUrl { get; init; }

    /// <summary>Populated on inbox queries — customer activity for online hint.</summary>
    public DateTime? CustomerLastSeenAt { get; init; }
}
