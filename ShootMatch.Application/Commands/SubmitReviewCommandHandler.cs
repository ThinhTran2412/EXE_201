using System.Linq;
using ShootMatch.Application.Abstractions;
using ShootMatch.Application.Services;
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
    IReviewRepository reviewRepository,
    IPhotographerRepository photographerRepository,
    NotificationService notificationService)
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
        await notificationService.NotifyReviewSubmittedAsync(
            booking.PhotographerId,
            booking.Id,
            cancellationToken);

        // 6. Recalculate average rating for photographer
        var photographer = await photographerRepository.GetByIdAsync(booking.PhotographerId, cancellationToken);
        if (photographer is not null)
        {
            var allReviews = await reviewRepository.GetByPhotographerIdAsync(booking.PhotographerId, cancellationToken);
            double newRating = allReviews.Count > 0 ? Math.Round(allReviews.Average(r => r.Rating), 1) : command.Rating;

            var updatedPhotographer = new Photographer
            {
                Id = photographer.Id,
                DisplayName = photographer.DisplayName,
                Phone = photographer.Phone,
                Email = photographer.Email,
                Region = photographer.Region,
                AvatarUrl = photographer.AvatarUrl,
                CoverPhotoUrl = photographer.CoverPhotoUrl,
                Bio = photographer.Bio,
                Quote = photographer.Quote,
                NationalId = photographer.NationalId,
                PersonalAddress = photographer.PersonalAddress,
                VerificationDocumentFrontUrl = photographer.VerificationDocumentFrontUrl,
                VerificationDocumentBackUrl = photographer.VerificationDocumentBackUrl,
                VerificationPortraitUrl = photographer.VerificationPortraitUrl,
                InstagramUrl = photographer.InstagramUrl,
                MinBudget = photographer.MinBudget,
                MaxBudget = photographer.MaxBudget,
                Rating = newRating,
                IsPremium = photographer.IsPremium,
                IsAvailable = photographer.IsAvailable,
                AcceptsInstantBooking = photographer.AcceptsInstantBooking,
                VerificationStatus = photographer.VerificationStatus,
                PasswordHash = photographer.PasswordHash,
                GoogleId = photographer.GoogleId,
                CreatedAt = photographer.CreatedAt,
                UpdatedAt = DateTime.UtcNow,
                DeletedAt = photographer.DeletedAt,
                PortfolioEmbeddings = photographer.PortfolioEmbeddings,
                PortfolioPhotos = photographer.PortfolioPhotos
            };

            await photographerRepository.UpsertAsync(updatedPhotographer, cancellationToken);
        }

        return review.Id;
    }
}
