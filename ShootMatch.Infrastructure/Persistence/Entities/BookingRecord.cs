namespace ShootMatch.Infrastructure.Persistence.Entities;

public sealed class BookingRecord
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public Guid PhotographerId { get; set; }
    public Guid MatchId { get; set; }
    public Guid? ServicePackageId { get; set; }
    public string Status { get; set; } = "Pending"; // Pending | AwaitingDeposit | Confirmed | Completed | Cancelled | Disputed
    public decimal AgreedPrice { get; set; }
    public decimal Commission { get; set; }
    public decimal DepositRate { get; set; }
    public decimal DepositAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string PaymentStatus { get; set; } = "Unpaid"; // Unpaid | DepositPaid | FullyPaid
    public long? PayOsOrderCode { get; set; }
    public string EscrowStatus { get; set; } = "Held"; // Held | Released | Refunded
    public DateTime ScheduledAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancellationReason { get; set; }
    public string? Phone { get; set; }
    public string? Location { get; set; }
    public string? Note { get; set; }
    public string? Requirements { get; set; }
}
