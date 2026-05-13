using ShootMatch.Application.Contracts;

namespace ShootMatch.Application.Abstractions;

public interface IMatchResultStore
{
    Task SaveAsync(MatchSearchResult result, CancellationToken cancellationToken);
    Task<MatchSearchResult?> GetAsync(Guid searchId, CancellationToken cancellationToken);
}
