using System.Collections.Concurrent;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Aggregates;

namespace ShootMatch.Infrastructure.Persistence;

public sealed class InMemoryBookingRepository : IBookingRepository
{
    private readonly ConcurrentDictionary<Guid, BookingAggregate> _bookings = new();

    public Task SaveAsync(BookingAggregate booking, CancellationToken cancellationToken = default)
    {
        _bookings[booking.Id] = booking;
        return Task.CompletedTask;
    }

    public Task<BookingAggregate?> GetByIdAsync(Guid bookingId, CancellationToken cancellationToken = default)
    {
        _bookings.TryGetValue(bookingId, out var booking);
        return Task.FromResult(booking);
    }

    public Task<IReadOnlyList<BookingAggregate>> GetByMatchIdAsync(Guid matchId, CancellationToken cancellationToken = default)
    {
        var result = (IReadOnlyList<BookingAggregate>)_bookings.Values
            .Where(b => b.MatchId == matchId).ToList();
        return Task.FromResult(result);
    }

    public Task<IReadOnlyList<BookingAggregate>> GetByCustomerIdAsync(Guid customerId, CancellationToken cancellationToken = default)
    {
        var result = (IReadOnlyList<BookingAggregate>)_bookings.Values
            .Where(b => b.CustomerId == customerId)
            .OrderByDescending(b => b.CreatedAt)
            .ToList();
        return Task.FromResult(result);
    }

    public Task<IReadOnlyList<BookingAggregate>> GetByPhotographerIdAsync(Guid photographerId, CancellationToken cancellationToken = default)
    {
        var result = (IReadOnlyList<BookingAggregate>)_bookings.Values
            .Where(b => b.PhotographerId == photographerId)
            .OrderByDescending(b => b.CreatedAt)
            .ToList();
        return Task.FromResult(result);
    }
}
