using Microsoft.EntityFrameworkCore;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;
using ShootMatch.Infrastructure.Persistence.Entities;

namespace ShootMatch.Infrastructure.Persistence;

public sealed class EfAuthSessionRepository(ShootMatchDbContext db) : IAuthSessionRepository
{
    public async Task SaveAsync(AuthSession session, CancellationToken cancellationToken)
    {
        var record = new AuthSessionRecord
        {
            Id           = session.Id,
            CustomerId   = session.CustomerId,
            RefreshToken = session.RefreshToken,
            ExpiresAt    = session.ExpiresAt,
            IsRevoked    = session.IsRevoked,
            CreatedAt    = session.CreatedAt,
            RevokedAt    = session.RevokedAt
        };
        await db.AuthSessions.AddAsync(record, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<AuthSession?> GetByRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken)
    {
        var r = await db.AuthSessions.AsNoTracking()
            .FirstOrDefaultAsync(x => x.RefreshToken == refreshToken, cancellationToken);
        if (r is null) return null;
        return new AuthSession
        {
            Id           = r.Id,
            CustomerId   = r.CustomerId,
            RefreshToken = r.RefreshToken,
            ExpiresAt    = r.ExpiresAt,
            IsRevoked    = r.IsRevoked,
            CreatedAt    = r.CreatedAt,
            RevokedAt    = r.RevokedAt
        };
    }

    public async Task RevokeAsync(string refreshToken, CancellationToken cancellationToken)
    {
        var r = await db.AuthSessions
            .FirstOrDefaultAsync(x => x.RefreshToken == refreshToken, cancellationToken);
        if (r is null) return;
        r.IsRevoked = true;
        r.RevokedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
    }
}
