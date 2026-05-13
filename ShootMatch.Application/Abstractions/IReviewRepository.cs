using ShootMatch.Domain.Entities;

namespace ShootMatch.Application.Abstractions;

public interface IReviewRepository
{
    Task SaveAsync(Review review, CancellationToken cancellationToken = default);
    Task<Review?> GetByBookingIdAsync(Guid bookingId, CancellationToken cancellationToken = default);

    /// <summary>All reviews written by a customer.</summary>
    Task<IReadOnlyList<Review>> GetByCustomerIdAsync(Guid customerId, CancellationToken cancellationToken = default);

    /// <summary>All reviews received by a photographer.</summary>
    Task<IReadOnlyList<Review>> GetByPhotographerIdAsync(Guid photographerId, CancellationToken cancellationToken = default);
}
