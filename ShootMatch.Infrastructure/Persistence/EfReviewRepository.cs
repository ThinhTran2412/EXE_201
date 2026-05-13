using Microsoft.EntityFrameworkCore;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;
using ShootMatch.Infrastructure.Persistence.Entities;

namespace ShootMatch.Infrastructure.Persistence;

public sealed class EfReviewRepository(ShootMatchDbContext db) : IReviewRepository
{
    public async Task SaveAsync(Review review, CancellationToken cancellationToken = default)
    {
        var existing = await db.Reviews.FirstOrDefaultAsync(x => x.Id == review.Id, cancellationToken);
        if (existing is null)
        {
            await db.Reviews.AddAsync(new ReviewRecord
            {
                Id                   = review.Id,
                BookingId            = review.BookingId,
                AuthorCustomerId     = review.AuthorCustomerId,
                TargetPhotographerId = review.TargetPhotographerId,
                Rating               = review.Rating,
                Comment              = review.Comment,
                CreatedAt            = review.CreatedAt
            }, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<Review?> GetByBookingIdAsync(Guid bookingId, CancellationToken cancellationToken = default)
    {
        var r = await db.Reviews.AsNoTracking()
            .FirstOrDefaultAsync(x => x.BookingId == bookingId, cancellationToken);
        return r is null ? null : ToEntity(r);
    }

    public async Task<IReadOnlyList<Review>> GetByCustomerIdAsync(Guid customerId, CancellationToken cancellationToken = default)
    {
        var records = await db.Reviews.AsNoTracking()
            .Where(x => x.AuthorCustomerId == customerId)
            .OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken);
        return records.Select(ToEntity).ToList();
    }

    public async Task<IReadOnlyList<Review>> GetByPhotographerIdAsync(Guid photographerId, CancellationToken cancellationToken = default)
    {
        var records = await db.Reviews.AsNoTracking()
            .Where(x => x.TargetPhotographerId == photographerId)
            .OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken);
        return records.Select(ToEntity).ToList();
    }

    private static Review ToEntity(ReviewRecord r) => new()
    {
        Id                   = r.Id,
        BookingId            = r.BookingId,
        AuthorCustomerId     = r.AuthorCustomerId,
        TargetPhotographerId = r.TargetPhotographerId,
        Rating               = r.Rating,
        Comment              = r.Comment,
        CreatedAt            = r.CreatedAt
    };
}
