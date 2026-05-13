namespace ShootMatch.Infrastructure.Persistence.Entities;

public sealed class MatchRecord
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public Guid PhotographerId { get; set; }
    public Guid SearchSessionId { get; set; }
    public string Status { get; set; } = "Pending"; // Pending | Active | Closed
    public DateTime MatchedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
}
