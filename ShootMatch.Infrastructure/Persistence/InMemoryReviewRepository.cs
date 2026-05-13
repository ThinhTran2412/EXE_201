using System.Collections.Concurrent;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;

namespace ShootMatch.Infrastructure.Persistence;

public sealed class InMemoryReviewRepository : IReviewRepository
{
    private readonly ConcurrentDictionary<Guid, Review> _reviews = new();

    public Task SaveAsync(Review review, CancellationToken cancellationToken = default)
    {
        _reviews[review.Id] = review;
        return Task.CompletedTask;
    }

    public Task<Review?> GetByBookingIdAsync(Guid bookingId, CancellationToken cancellationToken = default)
    {
        var review = _reviews.Values.FirstOrDefault(r => r.BookingId == bookingId);
        return Task.FromResult(review);
    }

    public Task<IReadOnlyList<Review>> GetByCustomerIdAsync(Guid customerId, CancellationToken cancellationToken = default)
    {
        var result = (IReadOnlyList<Review>)_reviews.Values
            .Where(r => r.AuthorCustomerId == customerId)
            .OrderByDescending(r => r.CreatedAt)
            .ToList();
        return Task.FromResult(result);
    }

    public Task<IReadOnlyList<Review>> GetByPhotographerIdAsync(Guid photographerId, CancellationToken cancellationToken = default)
    {
        var result = (IReadOnlyList<Review>)_reviews.Values
            .Where(r => r.TargetPhotographerId == photographerId)
            .OrderByDescending(r => r.CreatedAt)
            .ToList();
        return Task.FromResult(result);
    }
}
