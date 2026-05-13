using ShootMatch.Domain.Common;
using ShootMatch.Domain.Events;
using ShootMatch.Domain.Exceptions;

namespace ShootMatch.Domain.Aggregates;

/// <summary>
/// Aggregate Root — Match
/// State machine: Pending → Active → BookingCreated → Closed
/// Invariant: only Active matches may create a Booking.
/// </summary>
public sealed class MatchAggregate : AggregateRoot
{
    public Guid Id { get; private set; }
    public Guid CustomerId { get; private set; }
    public Guid PhotographerId { get; private set; }
    public Guid SearchSessionId { get; private set; }
    public MatchStatus Status { get; private set; }
    public DateTime MatchedAt { get; private set; }
    public DateTime? ClosedAt { get; private set; }

    private MatchAggregate() { } // EF / reconstitution

    /// <summary>
    /// Reconstitutes a MatchAggregate from persistence (no domain events raised).
    /// Used by EF Core repositories when loading from DB.
    /// </summary>
    public static MatchAggregate Reconstitute(
        Guid id, Guid customerId, Guid photographerId,
        Guid searchSessionId, MatchStatus status,
        DateTime matchedAt, DateTime? closedAt) => new()
    {
        Id             = id,
        CustomerId     = customerId,
        PhotographerId = photographerId,
        SearchSessionId = searchSessionId,
        Status         = status,
        MatchedAt      = matchedAt,
        ClosedAt       = closedAt
    };


    /// <summary>
    /// Factory — creates a new Match in Pending state.
    /// </summary>
    public static MatchAggregate Create(
        Guid customerId,
        Guid photographerId,
        Guid searchSessionId)
    {
        var match = new MatchAggregate
        {
            Id = Guid.NewGuid(),
            CustomerId = customerId,
            PhotographerId = photographerId,
            SearchSessionId = searchSessionId,
            Status = MatchStatus.Pending,
            MatchedAt = DateTime.UtcNow
        };
        return match;
    }

    /// <summary>
    /// Photographer accepts the swipe — moves to Active.
    /// Fires MatchCreated event → downstream creates Conversation.
    /// </summary>
    public void Accept()
    {
        if (Status != MatchStatus.Pending)
            throw new DomainException($"Cannot accept a match that is already {Status}.");

        Status = MatchStatus.Active;
        RaiseDomainEvent(new MatchCreated(Id, CustomerId, PhotographerId, DateTime.UtcNow));
    }

    /// <summary>
    /// Called when a Booking is created from this Match.
    /// Guard: only Active matches may create bookings.
    /// </summary>
    public void MarkBookingCreated()
    {
        if (Status != MatchStatus.Active)
            throw new DomainException($"Cannot create a booking from a match that is {Status}. Match must be Active.");

        Status = MatchStatus.BookingCreated;
    }

    /// <summary>
    /// Closes the match (booking completed, cancelled, or either party closed).
    /// </summary>
    public void Close()
    {
        if (Status == MatchStatus.Closed)
            throw new DomainException("Match is already closed.");

        Status = MatchStatus.Closed;
        ClosedAt = DateTime.UtcNow;
    }
}

public enum MatchStatus { Pending, Active, BookingCreated, Closed }
