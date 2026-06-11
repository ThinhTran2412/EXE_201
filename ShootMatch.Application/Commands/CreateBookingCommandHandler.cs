using ShootMatch.Application.Abstractions;
using ShootMatch.Application.Services;
using ShootMatch.Domain.Aggregates;
using ShootMatch.Domain.Exceptions;

namespace ShootMatch.Application.Commands;

/// <summary>
/// Creates a Booking from an Active Match.
/// Invariant (enforced by domain): only Active matches may create bookings.
/// </summary>
public sealed class CreateBookingCommandHandler(
    IMatchRepository matchRepository,
    IBookingRepository bookingRepository,
    NotificationService notificationService)
{
    public async Task<Guid> HandleAsync(
        CreateBookingCommand command,
        CancellationToken cancellationToken = default)
    {
        // 1. Load the match
        var match = await matchRepository.GetByIdAsync(command.MatchId, cancellationToken)
            ?? throw new DomainException($"Match {command.MatchId} not found.");

        // 2. Validate caller owns this match
        if (match.CustomerId != command.CustomerId)
            throw new DomainException("You are not a participant of this match.");

        // 3. Domain invariant: match must be Active (throws DomainException if not)
        match.MarkBookingCreated();

        // 4. Create the booking aggregate
        var booking = BookingAggregate.Create(
            customerId:      match.CustomerId,
            photographerId:  match.PhotographerId,
            matchId:         match.Id,
            servicePackageId: command.ServicePackageId,
            agreedPrice:     command.AgreedPrice,
            commission:      command.Commission,
            scheduledAt:     command.ScheduledAt,
            phone:           command.Phone,
            location:        command.Location,
            note:            command.Note,
            requirements:    command.Requirements);

        // 5. Persist both
        await matchRepository.SaveAsync(match, cancellationToken);
        await bookingRepository.SaveAsync(booking, cancellationToken);
        await notificationService.NotifyBookingCreatedAsync(
            booking.PhotographerId,
            booking.Id,
            booking.ScheduledAt,
            cancellationToken);

        return booking.Id;
    }
}
