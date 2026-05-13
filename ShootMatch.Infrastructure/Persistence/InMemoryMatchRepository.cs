using System.Collections.Concurrent;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Aggregates;

namespace ShootMatch.Infrastructure.Persistence;

public sealed class InMemoryMatchRepository : IMatchRepository
{
    private readonly ConcurrentDictionary<Guid, MatchAggregate> _matches = new();

    public Task SaveAsync(MatchAggregate match, CancellationToken cancellationToken = default)
    {
        _matches[match.Id] = match;
        return Task.CompletedTask;
    }

    public Task<MatchAggregate?> GetByIdAsync(Guid matchId, CancellationToken cancellationToken = default)
    {
        _matches.TryGetValue(matchId, out var match);
        return Task.FromResult(match);
    }

    public Task<MatchAggregate?> FindAsync(Guid customerId, Guid photographerId, CancellationToken cancellationToken = default)
    {
        var match = _matches.Values.FirstOrDefault(m =>
            m.CustomerId == customerId && m.PhotographerId == photographerId);
        return Task.FromResult(match);
    }

    public Task<IReadOnlyList<MatchAggregate>> GetByCustomerIdAsync(Guid customerId, CancellationToken cancellationToken = default)
    {
        var result = (IReadOnlyList<MatchAggregate>)_matches.Values
            .Where(m => m.CustomerId == customerId)
            .OrderByDescending(m => m.MatchedAt)
            .ToList();
        return Task.FromResult(result);
    }

    public Task<IReadOnlyList<MatchAggregate>> GetByPhotographerIdAsync(Guid photographerId, CancellationToken cancellationToken = default)
    {
        var result = (IReadOnlyList<MatchAggregate>)_matches.Values
            .Where(m => m.PhotographerId == photographerId)
            .OrderByDescending(m => m.MatchedAt)
            .ToList();
        return Task.FromResult(result);
    }
}
