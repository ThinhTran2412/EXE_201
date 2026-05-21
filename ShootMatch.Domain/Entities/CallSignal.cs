namespace ShootMatch.Domain.Entities;

/// <summary>
/// Ephemeral WebRTC signal envelope. The backend validates participants,
/// persists delivery metadata, and forwards the payload to the correct room.
/// </summary>
public sealed class CallSignal
{
    public Guid Id { get; init; }
    public Guid ConversationId { get; init; }
    public Guid? CallSessionId { get; init; }
    public Guid SenderId { get; init; }

    /// <summary>customer | photographer | system</summary>
    public string SenderRole { get; init; } = string.Empty;

    /// <summary>offer | answer | ice | mute | unmute | hangup | reject | ring | accept</summary>
    public string SignalType { get; init; } = string.Empty;

    public string PayloadJson { get; init; } = string.Empty;
    public DateTime SentAt { get; init; }
}
