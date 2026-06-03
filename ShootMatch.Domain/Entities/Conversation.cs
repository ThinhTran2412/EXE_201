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
}
