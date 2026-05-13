using ShootMatch.Domain.Aggregates;

namespace ShootMatch.Application.Abstractions;

public interface IMatchRepository
{
    Task SaveAsync(MatchAggregate match, CancellationToken cancellationToken = default);
    Task<MatchAggregate?> GetByIdAsync(Guid matchId, CancellationToken cancellationToken = default);

    /// <summary>Returns existing match between customer and photographer (dedup check).</summary>
    Task<MatchAggregate?> FindAsync(Guid customerId, Guid photographerId, CancellationToken cancellationToken = default);

    /// <summary>All matches for a given customer (any status).</summary>
    Task<IReadOnlyList<MatchAggregate>> GetByCustomerIdAsync(Guid customerId, CancellationToken cancellationToken = default);

    /// <summary>All matches for a given photographer (any status).</summary>
    Task<IReadOnlyList<MatchAggregate>> GetByPhotographerIdAsync(Guid photographerId, CancellationToken cancellationToken = default);
}
