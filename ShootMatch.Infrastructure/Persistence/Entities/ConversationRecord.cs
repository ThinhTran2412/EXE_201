namespace ShootMatch.Infrastructure.Persistence.Entities;

public sealed class ConversationRecord
{
    public Guid Id { get; set; }
    public Guid MatchId { get; set; }
    public Guid CustomerId { get; set; }
    public Guid PhotographerId { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; }
    public DateTime? LastMessageAt { get; set; }
    public ICollection<MessageRecord> Messages { get; set; } = [];
    public ICollection<CallSessionRecord> CallSessions { get; set; } = [];
}
