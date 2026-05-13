using Microsoft.EntityFrameworkCore;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;
using ShootMatch.Infrastructure.Persistence.Entities;

namespace ShootMatch.Infrastructure.Persistence;

public sealed class EfVerificationRequestRepository(ShootMatchDbContext db) : IVerificationRequestRepository
{
    public async Task SaveAsync(VerificationRequest request, CancellationToken cancellationToken = default)
    {
        var existing = await db.VerificationRequests
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (existing is null)
        {
            await db.VerificationRequests.AddAsync(new VerificationRequestRecord
            {
                Id               = request.Id,
                PhotographerId   = request.PhotographerId,
                DocumentType     = request.DocumentType,
                DocumentImageUrl = request.DocumentImageUrl,
                SelfieUrl        = request.SelfieUrl,
                Status           = request.Status,
                ReviewedBy       = request.ReviewedBy,
                CreatedAt        = request.CreatedAt,
                ReviewedAt       = request.ReviewedAt
            }, cancellationToken);
        }
        else
        {
            existing.Status     = request.Status;
            existing.ReviewedBy = request.ReviewedBy;
            existing.ReviewedAt = request.ReviewedAt;
        }
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<VerificationRequest?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var r = await db.VerificationRequests.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        return r is null ? null : ToEntity(r);
    }

    public async Task<VerificationRequest?> GetPendingByPhotographerIdAsync(Guid photographerId, CancellationToken cancellationToken = default)
    {
        var r = await db.VerificationRequests.AsNoTracking()
            .Where(x => x.PhotographerId == photographerId && x.Status == "Pending")
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
        return r is null ? null : ToEntity(r);
    }

    public async Task<IReadOnlyList<VerificationRequest>> GetAllPendingAsync(CancellationToken cancellationToken = default)
    {
        var records = await db.VerificationRequests.AsNoTracking()
            .Where(x => x.Status == "Pending")
            .OrderBy(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
        return records.Select(ToEntity).ToList();
    }

    private static VerificationRequest ToEntity(VerificationRequestRecord r) => new()
    {
        Id               = r.Id,
        PhotographerId   = r.PhotographerId,
        DocumentType     = r.DocumentType,
        DocumentImageUrl = r.DocumentImageUrl,
        SelfieUrl        = r.SelfieUrl,
        Status           = r.Status,
        ReviewedBy       = r.ReviewedBy,
        CreatedAt        = r.CreatedAt,
        ReviewedAt       = r.ReviewedAt
    };
}
