using ShootMatch.Domain.Entities;

namespace ShootMatch.Application.Abstractions;

public interface IAuthSessionRepository
{
    Task SaveAsync(AuthSession session, CancellationToken cancellationToken);
    Task<AuthSession?> GetByRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken);
    Task RevokeAsync(string refreshToken, CancellationToken cancellationToken);
}
