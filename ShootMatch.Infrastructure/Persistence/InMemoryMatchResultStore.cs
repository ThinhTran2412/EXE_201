using ShootMatch.Application.Abstractions;
using ShootMatch.Application.Contracts;
using System.Collections.Concurrent;

namespace ShootMatch.Infrastructure.Persistence;

public sealed class InMemoryMatchResultStore : IMatchResultStore
{
    private readonly ConcurrentDictionary<Guid, MatchSearchResult> _cache = new();

    public Task SaveAsync(MatchSearchResult result, CancellationToken cancellationToken)
    {
        _cache[result.SearchId] = result;
        return Task.CompletedTask;
    }

    public Task<MatchSearchResult?> GetAsync(Guid searchId, CancellationToken cancellationToken)
    {
        _cache.TryGetValue(searchId, out var result);
        return Task.FromResult(result);
    }
}
