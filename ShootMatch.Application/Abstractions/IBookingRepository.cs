using ShootMatch.Domain.Aggregates;

namespace ShootMatch.Application.Abstractions;

public interface IBookingRepository
{
    Task SaveAsync(BookingAggregate booking, CancellationToken cancellationToken = default);
    Task<BookingAggregate?> GetByIdAsync(Guid bookingId, CancellationToken cancellationToken = default);

    /// <summary>All bookings for a given match.</summary>
    Task<IReadOnlyList<BookingAggregate>> GetByMatchIdAsync(Guid matchId, CancellationToken cancellationToken = default);

    /// <summary>All bookings where customer is the buyer.</summary>
    Task<IReadOnlyList<BookingAggregate>> GetByCustomerIdAsync(Guid customerId, CancellationToken cancellationToken = default);

    /// <summary>All bookings assigned to a photographer.</summary>
    Task<IReadOnlyList<BookingAggregate>> GetByPhotographerIdAsync(Guid photographerId, CancellationToken cancellationToken = default);
}
