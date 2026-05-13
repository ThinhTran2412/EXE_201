namespace ShootMatch.Domain.Entities;

public sealed class Review
{
    public Guid Id { get; init; }
    public Guid BookingId { get; init; }
    public Guid AuthorCustomerId { get; init; }
    public Guid TargetPhotographerId { get; init; }
    public int Rating { get; init; } // 1-5
    public string Comment { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}
