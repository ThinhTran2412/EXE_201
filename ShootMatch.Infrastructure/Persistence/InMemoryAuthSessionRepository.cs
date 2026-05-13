using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;
using System.Collections.Concurrent;

namespace ShootMatch.Infrastructure.Persistence;

public sealed class InMemoryAuthSessionRepository : IAuthSessionRepository
{
    private readonly ConcurrentDictionary<string, AuthSession> _sessions = new(StringComparer.Ordinal);

    public Task SaveAsync(AuthSession session, CancellationToken cancellationToken)
    {
        _sessions[session.RefreshToken] = session;
        return Task.CompletedTask;
    }

    public Task<AuthSession?> GetByRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken)
    {
        _sessions.TryGetValue(refreshToken, out var session);
        return Task.FromResult(session);
    }

    public Task RevokeAsync(string refreshToken, CancellationToken cancellationToken)
    {
        if (_sessions.TryGetValue(refreshToken, out var session))
        {
            _sessions[refreshToken] = new AuthSession
            {
                Id = session.Id,
                CustomerId = session.CustomerId,
                RefreshToken = session.RefreshToken,
                ExpiresAt = session.ExpiresAt,
                IsRevoked = true,
                CreatedAt = session.CreatedAt
            };
        }

        return Task.CompletedTask;
    }
}
