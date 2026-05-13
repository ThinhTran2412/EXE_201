using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;
using System.Collections.Concurrent;

namespace ShootMatch.Infrastructure.Persistence;

public sealed class InMemorySearchSessionRepository : ISearchSessionRepository
{
    private readonly ConcurrentDictionary<Guid, SearchSession> _sessions = new();

    public Task SaveAsync(SearchSession session, CancellationToken cancellationToken)
    {
        _sessions[session.Id] = session;
        return Task.CompletedTask;
    }
}
