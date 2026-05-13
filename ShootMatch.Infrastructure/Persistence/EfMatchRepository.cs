using Microsoft.EntityFrameworkCore;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Aggregates;
using ShootMatch.Infrastructure.Persistence.Entities;

namespace ShootMatch.Infrastructure.Persistence;

public sealed class EfMatchRepository(ShootMatchDbContext db) : IMatchRepository
{
    public async Task SaveAsync(MatchAggregate match, CancellationToken cancellationToken = default)
    {
        var existing = await db.Matches.FirstOrDefaultAsync(x => x.Id == match.Id, cancellationToken);
        if (existing is null)
        {
            await db.Matches.AddAsync(new MatchRecord
            {
                Id             = match.Id,
                CustomerId     = match.CustomerId,
                PhotographerId = match.PhotographerId,
                SearchSessionId = match.SearchSessionId,
                Status         = match.Status.ToString(),
                MatchedAt      = match.MatchedAt,
                ClosedAt       = match.ClosedAt
            }, cancellationToken);
        }
        else
        {
            existing.Status   = match.Status.ToString();
            existing.ClosedAt = match.ClosedAt;
        }
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<MatchAggregate?> GetByIdAsync(Guid matchId, CancellationToken cancellationToken = default)
    {
        var r = await db.Matches.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == matchId, cancellationToken);
        return r is null ? null : ToEntity(r);
    }

    public async Task<MatchAggregate?> FindAsync(Guid customerId, Guid photographerId, CancellationToken cancellationToken = default)
    {
        var r = await db.Matches.AsNoTracking()
            .FirstOrDefaultAsync(x => x.CustomerId == customerId && x.PhotographerId == photographerId, cancellationToken);
        return r is null ? null : ToEntity(r);
    }

    public async Task<IReadOnlyList<MatchAggregate>> GetByCustomerIdAsync(Guid customerId, CancellationToken cancellationToken = default)
    {
        var records = await db.Matches.AsNoTracking()
            .Where(x => x.CustomerId == customerId)
            .OrderByDescending(x => x.MatchedAt)
            .ToListAsync(cancellationToken);
        return records.Select(ToEntity).ToList();
    }

    public async Task<IReadOnlyList<MatchAggregate>> GetByPhotographerIdAsync(Guid photographerId, CancellationToken cancellationToken = default)
    {
        var records = await db.Matches.AsNoTracking()
            .Where(x => x.PhotographerId == photographerId)
            .OrderByDescending(x => x.MatchedAt)
            .ToListAsync(cancellationToken);
        return records.Select(ToEntity).ToList();
    }

    private static MatchAggregate ToEntity(MatchRecord r)
    {
        var status = Enum.Parse<MatchStatus>(r.Status);
        return MatchAggregate.Reconstitute(
            r.Id, r.CustomerId, r.PhotographerId,
            r.SearchSessionId, status, r.MatchedAt, r.ClosedAt);
    }
}
