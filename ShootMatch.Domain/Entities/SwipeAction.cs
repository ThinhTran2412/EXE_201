namespace ShootMatch.Domain.Entities;

public sealed class SwipeAction
{
    public Guid Id { get; init; }
    public Guid CustomerId { get; init; }
    public Guid SearchSessionId { get; init; }
    public Guid PhotographerId { get; init; }
    public string Direction { get; init; } = "Left"; // Left | Right
    public DateTime CreatedAt { get; init; }
}
