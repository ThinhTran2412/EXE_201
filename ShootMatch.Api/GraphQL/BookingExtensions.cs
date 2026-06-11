using HotChocolate;
using HotChocolate.Types;
using Microsoft.EntityFrameworkCore;
using ShootMatch.Domain.Aggregates;
using ShootMatch.Infrastructure.Persistence;

namespace ShootMatch.Api.GraphQL;

[ExtendObjectType(typeof(BookingAggregate))]
public sealed class BookingExtensions
{
    public async Task<string?> GetCustomerName(
        [Parent] BookingAggregate booking,
        [Service] ShootMatchDbContext db,
        CancellationToken cancellationToken)
    {
        return await db.Customers.AsNoTracking()
            .Where(x => x.Id == booking.CustomerId)
            .Select(x => x.DisplayName)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<string?> GetServicePackageName(
        [Parent] BookingAggregate booking,
        [Service] ShootMatchDbContext db,
        CancellationToken cancellationToken)
    {
        if (booking.ServicePackageId == null)
        {
            return null;
        }

        return await db.ServicePackages.AsNoTracking()
            .Where(x => x.Id == booking.ServicePackageId.Value)
            .Select(x => x.Title)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<string?> GetCustomerAvatarUrl(
        [Parent] BookingAggregate booking,
        [Service] ShootMatchDbContext db,
        CancellationToken cancellationToken)
    {
        return await db.Customers.AsNoTracking()
            .Where(x => x.Id == booking.CustomerId)
            .Select(x => x.AvatarUrl)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<string?> GetServicePackageImageUrl(
        [Parent] BookingAggregate booking,
        [Service] ShootMatchDbContext db,
        CancellationToken cancellationToken)
    {
        if (booking.ServicePackageId == null) return null;
        
        return await db.ServicePackageMedia.AsNoTracking()
            .Where(x => x.ServicePackageId == booking.ServicePackageId.Value)
            .OrderBy(x => x.SortOrder)
            .Select(x => x.ImageUrl)
            .FirstOrDefaultAsync(cancellationToken);
    }
}
