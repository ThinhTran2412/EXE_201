using ShootMatch.Domain.Common;
using ShootMatch.Domain.Events;
using ShootMatch.Domain.Exceptions;

namespace ShootMatch.Domain.Aggregates;

/// <summary>
/// Aggregate Root — Booking
/// State machine: Pending → Confirmed → Completed → (Cancelled | Disputed)
/// Invariants:
///   - Review can only be created when status = Completed
///   - Escrow is released only on Completed
///   - Cancellation requires a reason
/// </summary>
public sealed class BookingAggregate : AggregateRoot
{
    public Guid Id { get; private set; }
    public Guid CustomerId { get; private set; }
    public Guid PhotographerId { get; private set; }
    public Guid MatchId { get; private set; }
    public Guid? ServicePackageId { get; private set; }
    public BookingStatus Status { get; private set; }
    public EscrowStatus EscrowStatus { get; private set; }
    public decimal AgreedPrice { get; private set; }
    public decimal Commission { get; private set; }
    public DateTime ScheduledAt { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? CompletedAt { get; private set; }
    public DateTime? CancelledAt { get; private set; }
    public string? CancellationReason { get; private set; }

    private BookingAggregate() { } // EF / reconstitution

    /// <summary>
    /// Reconstitutes a BookingAggregate from persistence (no domain events raised).
    /// </summary>
    public static BookingAggregate Reconstitute(
        Guid id, Guid customerId, Guid photographerId, Guid matchId, Guid? servicePackageId,
        BookingStatus status, EscrowStatus escrowStatus,
        decimal agreedPrice, decimal commission, DateTime scheduledAt,
        DateTime createdAt, DateTime? completedAt, DateTime? cancelledAt, string? cancellationReason) => new()
    {
        Id                 = id,
        CustomerId         = customerId,
        PhotographerId     = photographerId,
        MatchId            = matchId,
        ServicePackageId   = servicePackageId,
        Status             = status,
        EscrowStatus       = escrowStatus,
        AgreedPrice        = agreedPrice,
        Commission         = commission,
        ScheduledAt        = scheduledAt,
        CreatedAt          = createdAt,
        CompletedAt        = completedAt,
        CancelledAt        = cancelledAt,
        CancellationReason = cancellationReason
    };


    /// <summary>
    /// Factory — creates a Booking in Pending state.
    /// Precondition: MatchAggregate must be Active (enforced by caller).
    /// </summary>
    public static BookingAggregate Create(
        Guid customerId,
        Guid photographerId,
        Guid matchId,
        Guid? servicePackageId,
        decimal agreedPrice,
        decimal commissionRate,
        DateTime scheduledAt)
    {
        if (agreedPrice <= 0)
            throw new DomainException("Agreed price must be positive.");
        if (commissionRate is < 0 or > 1)
            throw new DomainException("Commission rate must be between 0 and 1.");

        return new BookingAggregate
        {
            Id = Guid.NewGuid(),
            CustomerId = customerId,
            PhotographerId = photographerId,
            MatchId = matchId,
            ServicePackageId = servicePackageId,
            Status = BookingStatus.Pending,
            EscrowStatus = EscrowStatus.Held,
            AgreedPrice = agreedPrice,
            Commission = Math.Round(agreedPrice * commissionRate, 2),
            ScheduledAt = scheduledAt,
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Photographer confirms the booking.
    /// Fires BookingConfirmed → escrow is held by payment handler.
    /// </summary>
    public void Confirm()
    {
        if (Status != BookingStatus.Pending)
            throw new DomainException($"Cannot confirm a booking that is {Status}.");

        Status = BookingStatus.Confirmed;
        RaiseDomainEvent(new BookingConfirmed(Id, CustomerId, PhotographerId, AgreedPrice, Commission, DateTime.UtcNow));
    }

    /// <summary>
    /// Marks the shoot as done. Releases escrow and opens Review window.
    /// Fires BookingCompleted → payment handler releases escrow.
    /// </summary>
    public void Complete()
    {
        if (Status != BookingStatus.Confirmed)
            throw new DomainException($"Cannot complete a booking that is {Status}.");

        Status = BookingStatus.Completed;
        EscrowStatus = EscrowStatus.Released;
        CompletedAt = DateTime.UtcNow;
        RaiseDomainEvent(new BookingCompleted(Id, CustomerId, PhotographerId, DateTime.UtcNow));
    }

    /// <summary>
    /// Cancels the booking. Escrow refund is handled by the payment event handler.
    /// </summary>
    public void Cancel(Guid cancelledByCustomerId, string reason)
    {
        if (Status is BookingStatus.Completed or BookingStatus.Cancelled)
            throw new DomainException($"Cannot cancel a booking that is already {Status}.");
        if (string.IsNullOrWhiteSpace(reason))
            throw new DomainException("Cancellation reason is required.");

        Status = BookingStatus.Cancelled;
        EscrowStatus = EscrowStatus.Refunded;
        CancellationReason = reason;
        CancelledAt = DateTime.UtcNow;
        RaiseDomainEvent(new BookingCancelled(Id, cancelledByCustomerId, reason, DateTime.UtcNow));
    }

    /// <summary>
    /// Marks the booking as disputed.
    /// </summary>
    public void Dispute()
    {
        if (Status is not (BookingStatus.Confirmed or BookingStatus.Completed))
            throw new DomainException($"Cannot dispute a booking that is {Status}.");

        Status = BookingStatus.Disputed;
    }

    /// <summary>
    /// Guard used before creating a Review.
    /// Called by Application layer — keeps invariant in domain.
    /// </summary>
    public void EnsureCanBeReviewed()
    {
        if (Status != BookingStatus.Completed)
            throw new DomainException("A review can only be submitted after the booking is Completed.");
    }
}

public enum BookingStatus { Pending, Confirmed, Completed, Cancelled, Disputed }
public enum EscrowStatus  { Held, Released, Refunded }
