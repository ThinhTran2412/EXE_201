namespace ShootMatch.Infrastructure.Persistence.Entities;

public sealed class SwipeActionRecord
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public Guid SearchSessionId { get; set; }
    public Guid PhotographerId { get; set; }
    public string Direction { get; set; } = "Left"; // Left | Right
    public DateTime CreatedAt { get; set; }
}
