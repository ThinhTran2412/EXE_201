using ShootMatch.Domain.Entities;

namespace ShootMatch.Application.Abstractions;

public interface ISearchSessionRepository
{
    Task SaveAsync(SearchSession session, CancellationToken cancellationToken);
}
