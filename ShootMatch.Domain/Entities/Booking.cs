namespace ShootMatch.Domain.Entities;

public sealed class Booking
{
    public Guid Id { get; init; }
    public Guid CustomerId { get; init; }
    public Guid PhotographerId { get; init; }
    public Guid MatchId { get; init; }
    public Guid? ServicePackageId { get; init; }
    // Pending | Confirmed | Completed | Cancelled | Disputed
    public string Status { get; init; } = "Pending";
    public decimal AgreedPrice { get; init; }
    public decimal Commission { get; init; }
    // Held | Released | Refunded
    public string EscrowStatus { get; init; } = "Held";
    public DateTime ScheduledAt { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
    public DateTime? CancelledAt { get; init; }
    public string? CancellationReason { get; init; }
}
