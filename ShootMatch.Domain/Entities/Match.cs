namespace ShootMatch.Domain.Entities;

public sealed class Match
{
    public Guid Id { get; init; }
    public Guid CustomerId { get; init; }
    public Guid PhotographerId { get; init; }
    public Guid SearchSessionId { get; init; }
    public string Status { get; init; } = "Pending"; // Pending | Active | Closed
    public DateTime MatchedAt { get; init; }
    public DateTime? ClosedAt { get; init; }
}
