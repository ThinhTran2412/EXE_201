namespace ShootMatch.Infrastructure.Persistence.Entities;

public sealed class CallSessionRecord
{
    public Guid Id { get; set; }
    public Guid ConversationId { get; set; }
    public string CallType { get; set; } = "audio";
    public string Status { get; set; } = "ringing";
    public Guid InitiatorId { get; set; }
    public string InitiatorRole { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime? AnsweredAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public string? EndReason { get; set; }
    public string? SessionToken { get; set; }
    public DateTime? LastSignalAt { get; set; }
    public ConversationRecord Conversation { get; set; } = null!;
}
