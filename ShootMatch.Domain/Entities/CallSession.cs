namespace ShootMatch.Domain.Entities;

/// <summary>
/// Persistent state for a voice/video call attached to a Conversation.
/// Signal payloads (offer/answer/ICE) flow through SignalR, while the session
/// itself is stored here so reconnects, retries, and history remain consistent.
/// </summary>
public sealed class CallSession
{
    public Guid Id { get; init; }
    public Guid ConversationId { get; init; }

    /// <summary>audio | video</summary>
    public string CallType { get; init; } = "audio";

    /// <summary>ringing | active | ended | rejected | missed | cancelled</summary>
    public string Status { get; init; } = "ringing";

    public Guid InitiatorId { get; init; }

    /// <summary>customer | photographer</summary>
    public string InitiatorRole { get; init; } = string.Empty;

    public DateTime StartedAt { get; init; }
    public DateTime? AnsweredAt { get; init; }
    public DateTime? EndedAt { get; init; }
    public string? EndReason { get; init; }
    public string? SessionToken { get; init; }
    public DateTime? LastSignalAt { get; init; }
}
