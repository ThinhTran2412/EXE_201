using HotChocolate;
using HotChocolate.Types;
using Microsoft.EntityFrameworkCore;
using ShootMatch.Domain.Entities;
using ShootMatch.Infrastructure.Persistence;

namespace ShootMatch.Api.GraphQL;

[ExtendObjectType(typeof(Review))]
public sealed class ReviewExtensions
{
    public async Task<string?> GetAuthorName(
        [Parent] Review review,
        [Service] ShootMatchDbContext db,
        CancellationToken cancellationToken)
    {
        return await db.Customers.AsNoTracking()
            .Where(x => x.Id == review.AuthorCustomerId)
            .Select(x => x.DisplayName)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<string?> GetAuthorAvatarUrl(
        [Parent] Review review,
        [Service] ShootMatchDbContext db,
        CancellationToken cancellationToken)
    {
        return await db.Customers.AsNoTracking()
            .Where(x => x.Id == review.AuthorCustomerId)
            .Select(x => x.AvatarUrl)
            .FirstOrDefaultAsync(cancellationToken);
    }
}
