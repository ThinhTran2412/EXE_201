using Microsoft.EntityFrameworkCore;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Aggregates;
using ShootMatch.Infrastructure.Persistence.Entities;

namespace ShootMatch.Infrastructure.Persistence;

public sealed class EfBookingRepository(ShootMatchDbContext db) : IBookingRepository
{
    public async Task SaveAsync(BookingAggregate booking, CancellationToken cancellationToken = default)
    {
        var existing = await db.Bookings.FirstOrDefaultAsync(x => x.Id == booking.Id, cancellationToken);
        if (existing is null)
        {
            await db.Bookings.AddAsync(new BookingRecord
            {
                Id               = booking.Id,
                CustomerId       = booking.CustomerId,
                PhotographerId   = booking.PhotographerId,
                MatchId          = booking.MatchId,
                ServicePackageId = booking.ServicePackageId,
                Status           = booking.Status.ToString(),
                EscrowStatus     = booking.EscrowStatus.ToString(),
                AgreedPrice      = booking.AgreedPrice,
                Commission       = booking.Commission,
                DepositRate      = booking.DepositRate,
                DepositAmount    = booking.DepositAmount,
                TotalAmount      = booking.TotalAmount,
                PaymentStatus    = booking.PaymentStatus.ToString(),
                PayOsOrderCode   = booking.PayOsOrderCode,
                ScheduledAt      = booking.ScheduledAt,
                CreatedAt        = booking.CreatedAt,
                CompletedAt      = booking.CompletedAt,
                CancelledAt      = booking.CancelledAt,
                CancellationReason = booking.CancellationReason,
                Phone            = booking.Phone,
                Location         = booking.Location,
                Note             = booking.Note,
                Requirements     = booking.Requirements
            }, cancellationToken);
        }
        else
        {
            existing.Status             = booking.Status.ToString();
            existing.EscrowStatus       = booking.EscrowStatus.ToString();
            existing.PaymentStatus      = booking.PaymentStatus.ToString();
            existing.PayOsOrderCode     = booking.PayOsOrderCode;
            existing.CompletedAt        = booking.CompletedAt;
            existing.CancelledAt        = booking.CancelledAt;
            existing.CancellationReason = booking.CancellationReason;
            existing.Phone              = booking.Phone;
            existing.Location           = booking.Location;
            existing.Note               = booking.Note;
            existing.Requirements       = booking.Requirements;
        }
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<BookingAggregate?> GetByIdAsync(Guid bookingId, CancellationToken cancellationToken = default)
    {
        var r = await db.Bookings.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == bookingId, cancellationToken);
        return r is null ? null : ToEntity(r);
    }

    public async Task<IReadOnlyList<BookingAggregate>> GetByMatchIdAsync(Guid matchId, CancellationToken cancellationToken = default)
    {
        var records = await db.Bookings.AsNoTracking()
            .Where(x => x.MatchId == matchId).ToListAsync(cancellationToken);
        return records.Select(ToEntity).ToList();
    }

    public async Task<IReadOnlyList<BookingAggregate>> GetByCustomerIdAsync(Guid customerId, CancellationToken cancellationToken = default)
    {
        var records = await db.Bookings.AsNoTracking()
            .Where(x => x.CustomerId == customerId)
            .OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken);
        return records.Select(ToEntity).ToList();
    }

    public async Task<IReadOnlyList<BookingAggregate>> GetByPhotographerIdAsync(Guid photographerId, CancellationToken cancellationToken = default)
    {
        var records = await db.Bookings.AsNoTracking()
            .Where(x => x.PhotographerId == photographerId)
            .OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken);
        return records.Select(ToEntity).ToList();
    }

    public async Task<IReadOnlyList<BookingAggregate>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var records = await db.Bookings.AsNoTracking().ToListAsync(cancellationToken);
        return records.Select(ToEntity).ToList();
    }

    private static BookingAggregate ToEntity(BookingRecord r)
    {
        var aggregate = BookingAggregate.Reconstitute(
            r.Id, r.CustomerId, r.PhotographerId, r.MatchId, r.ServicePackageId,
            string.IsNullOrEmpty(r.Status) ? BookingStatus.Pending : Enum.Parse<BookingStatus>(r.Status),
            string.IsNullOrEmpty(r.EscrowStatus) ? EscrowStatus.Held : Enum.Parse<EscrowStatus>(r.EscrowStatus),
            string.IsNullOrEmpty(r.PaymentStatus) ? PaymentStatus.Unpaid : Enum.Parse<PaymentStatus>(r.PaymentStatus),
            r.AgreedPrice, r.Commission, r.DepositRate, r.DepositAmount, r.TotalAmount, r.PayOsOrderCode, r.ScheduledAt,
            r.CreatedAt, r.CompletedAt, r.CancelledAt, r.CancellationReason,
            r.Phone, r.Location, r.Note, r.Requirements);

        return aggregate;
    }
}
