using ShootMatch.Domain.Abstractions;

namespace ShootMatch.Domain.Events;

/// <summary>
/// Raised when a customer swipes right on a photographer.
/// Consumers: check if photographer also expressed interest → create Match.
/// </summary>
public sealed record SwipeRightRecorded(
    Guid SwipeActionId,
    Guid CustomerId,
    Guid PhotographerId,
    Guid SearchSessionId,
    DateTime OccurredAt) : IDomainEvent;

/// <summary>
/// Raised when a Match reaches Active status (both sides agree).
/// Consumers: create Conversation, send notification to both parties.
/// </summary>
public sealed record MatchCreated(
    Guid MatchId,
    Guid CustomerId,
    Guid PhotographerId,
    DateTime OccurredAt) : IDomainEvent;

/// <summary>
/// Raised when a Booking transitions to Confirmed.
/// Consumers: hold escrow, send confirmation notification.
/// </summary>
public sealed record BookingConfirmed(
    Guid BookingId,
    Guid CustomerId,
    Guid PhotographerId,
    decimal AgreedPrice,
    decimal Commission,
    DateTime OccurredAt) : IDomainEvent;

/// <summary>
/// Raised when a Booking transitions to Completed.
/// Consumers: release escrow to photographer, open review window, send notification.
/// </summary>
public sealed record BookingCompleted(
    Guid BookingId,
    Guid CustomerId,
    Guid PhotographerId,
    DateTime OccurredAt) : IDomainEvent;

/// <summary>
/// Raised when a Booking is Cancelled by either party.
/// Consumers: refund escrow if applicable, close Match, notify both parties.
/// </summary>
public sealed record BookingCancelled(
    Guid BookingId,
    Guid CancelledByCustomerId,
    string Reason,
    DateTime OccurredAt) : IDomainEvent;

/// <summary>
/// Raised when a VerificationRequest is approved by an admin.
/// Consumers: update Photographer.VerificationStatus to Verified, boost visibility in ranking.
/// </summary>
public sealed record PhotographerVerified(
    Guid PhotographerId,
    Guid VerificationRequestId,
    DateTime OccurredAt) : IDomainEvent;

/// <summary>
/// Raised when a PremiumSubscription expires or is cancelled.
/// Consumers: update Photographer premium flag in search ranking.
/// </summary>
public sealed record PremiumExpired(
    Guid PhotographerId,
    Guid SubscriptionId,
    DateTime OccurredAt) : IDomainEvent;
