using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;
using ShootMatch.Domain.Exceptions;

namespace ShootMatch.Application.Commands;

/// <summary>
/// Submits a review for a completed booking.
/// Enforces: booking must be Completed (via BookingAggregate.EnsureCanBeReviewed).
/// Enforces: no duplicate review per booking.
/// </summary>
public sealed class SubmitReviewCommandHandler(
    IBookingRepository bookingRepository,
    IReviewRepository reviewRepository)
{
    public async Task<Guid> HandleAsync(
        SubmitReviewCommand command,
        CancellationToken cancellationToken = default)
    {
        if (command.Rating is < 1 or > 5)
            throw new DomainException("Rating must be between 1 and 5.");

        // 1. Load the booking
        var booking = await bookingRepository.GetByIdAsync(command.BookingId, cancellationToken)
            ?? throw new DomainException($"Booking {command.BookingId} not found.");

        // 2. Validate caller is the customer of this booking
        if (booking.CustomerId != command.CustomerId)
            throw new DomainException("You are not the customer of this booking.");

        // 3. Domain invariant: booking must be Completed (throws DomainException if not)
        booking.EnsureCanBeReviewed();

        // 4. Deduplication: one review per booking
        var existing = await reviewRepository.GetByBookingIdAsync(command.BookingId, cancellationToken);
        if (existing is not null)
            throw new DomainException("A review has already been submitted for this booking.");

        // 5. Create and persist the review
        var review = new Review
        {
            Id                  = Guid.NewGuid(),
            BookingId           = command.BookingId,
            AuthorCustomerId    = command.CustomerId,
            TargetPhotographerId = booking.PhotographerId,
            Rating              = command.Rating,
            Comment             = command.Comment,
            CreatedAt           = DateTime.UtcNow
        };

        await reviewRepository.SaveAsync(review, cancellationToken);
        return review.Id;
    }
}
