namespace ShootMatch.Application.Commands;

/// <summary>
/// Sends a text or image message to a Conversation.
/// Hub calls this after validating the caller is a participant.
/// </summary>
public sealed record SendMessageCommand(
    Guid ConversationId,
    Guid SenderId,
    /// <summary>customer | photographer</summary>
    string SenderRole,
    string Content,
    /// <summary>Text | Image</summary>
    string ContentType = "Text",
    string? MediaPreviewUrl = null,
    DateTime? MediaExpiresAt = null);
