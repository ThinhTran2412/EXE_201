namespace ShootMatch.Infrastructure.Persistence.Entities;

public sealed class MessageRecord
{
    public Guid Id { get; set; }
    public Guid ConversationId { get; set; }
    public Guid SenderId { get; set; }

    /// <summary>customer | photographer</summary>
    public string SenderRole { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;

    /// <summary>Text | Image</summary>
    public string ContentType { get; set; } = "Text";

    public DateTime SentAt { get; set; }
    public DateTime? ReadAt { get; set; }

    // Navigation
    public ConversationRecord Conversation { get; set; } = null!;
}
