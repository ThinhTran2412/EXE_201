namespace ShootMatch.Infrastructure.Persistence.Entities;

public sealed class BookingRecord
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public Guid PhotographerId { get; set; }
    public Guid MatchId { get; set; }
    public Guid? ServicePackageId { get; set; }
    public string Status { get; set; } = "Pending"; // Pending | Confirmed | Completed | Cancelled | Disputed
    public decimal AgreedPrice { get; set; }
    public decimal Commission { get; set; }
    public string EscrowStatus { get; set; } = "Held"; // Held | Released | Refunded
    public DateTime ScheduledAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancellationReason { get; set; }
}
