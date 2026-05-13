namespace ShootMatch.Domain.Entities;

/// <summary>
/// A single message inside a Conversation.
/// SenderRole distinguishes who sent it (used for UI bubble direction).
/// </summary>
public sealed class Message
{
    public Guid Id { get; init; }
    public Guid ConversationId { get; init; }
    public Guid SenderId { get; init; }

    /// <summary>customer | photographer</summary>
    public string SenderRole { get; init; } = string.Empty;

    public string Content { get; init; } = string.Empty;

    /// <summary>Text | Image</summary>
    public string ContentType { get; init; } = "Text";

    public DateTime SentAt { get; init; }

    /// <summary>Null until the other party reads it.</summary>
    public DateTime? ReadAt { get; init; }
}
