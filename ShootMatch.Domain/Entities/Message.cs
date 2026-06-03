namespace ShootMatch.Domain.Entities;

public sealed class Message
{
    public Guid Id { get; init; }
    public Guid ConversationId { get; init; }
    public Guid SenderId { get; init; }
    public string SenderRole { get; init; } = string.Empty;
    public string Content { get; init; } = string.Empty;
    public string ContentType { get; init; } = "Text";
    public DateTime SentAt { get; init; }
    public DateTime? ReadAt { get; init; }
}
