using Microsoft.EntityFrameworkCore;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;
using ShootMatch.Infrastructure.Persistence.Entities;

namespace ShootMatch.Infrastructure.Persistence;

public sealed class EfPhotographerRepository(ShootMatchDbContext db) : IPhotographerRepository
{
    public async Task<IReadOnlyList<Photographer>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var records = await db.Photographers
            .Include(x => x.PortfolioEmbeddings)
            .Include(x => x.PortfolioPhotos)
            .AsNoTracking()
            .AsSplitQuery()
            .Where(x => x.DeletedAt == null)
            .ToListAsync(cancellationToken);
        return records.Select(ToEntity).ToList();
    }

    public async Task<Photographer?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var r = await db.Photographers
            .Include(x => x.PortfolioEmbeddings)
            .Include(x => x.PortfolioPhotos)
            .AsNoTracking()
            .AsSplitQuery()
            .FirstOrDefaultAsync(x => x.Id == id && x.DeletedAt == null, cancellationToken);
        return r is null ? null : ToEntity(r);
    }

    public async Task<Photographer?> GetByPhoneAsync(string phone, CancellationToken cancellationToken = default)
    {
        var r = await db.Photographers.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Phone == phone && x.DeletedAt == null, cancellationToken);
        return r is null ? null : ToEntity(r);
    }

    public async Task<Photographer?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalised = email.ToLowerInvariant();
        var r = await db.Photographers.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Email == normalised && x.DeletedAt == null, cancellationToken);
        return r is null ? null : ToEntity(r);
    }

    public async Task<Photographer?> GetByGoogleIdAsync(string googleId, CancellationToken cancellationToken = default)
    {
        var r = await db.Photographers.AsNoTracking()
            .FirstOrDefaultAsync(x => x.GoogleId == googleId && x.DeletedAt == null, cancellationToken);
        return r is null ? null : ToEntity(r);
    }

    public async Task UpsertAsync(Photographer photographer, CancellationToken cancellationToken = default)
    {
        var existing = await db.Photographers
            .Include(x => x.PortfolioEmbeddings)
            .FirstOrDefaultAsync(x => x.Id == photographer.Id, cancellationToken);

        if (existing is null)
        {
            var record = ToRecord(photographer);
            await db.Photographers.AddAsync(record, cancellationToken);
        }
        else
        {
            existing.DisplayName          = photographer.DisplayName;
            existing.Phone                = photographer.Phone;
            existing.Email                = photographer.Email.ToLowerInvariant();
            existing.Region               = photographer.Region;
            existing.AvatarUrl            = photographer.AvatarUrl;
            existing.CoverPhotoUrl        = photographer.CoverPhotoUrl;
            existing.Bio                  = photographer.Bio;
            existing.Quote                = photographer.Quote;
            existing.InstagramUrl         = photographer.InstagramUrl;
            existing.MinBudget            = photographer.MinBudget;
            existing.MaxBudget            = photographer.MaxBudget;
            existing.Rating               = photographer.Rating;
            existing.IsPremium            = photographer.IsPremium;
            existing.IsAvailable          = photographer.IsAvailable;
            existing.AcceptsInstantBooking = photographer.AcceptsInstantBooking;
            existing.VerificationStatus   = photographer.VerificationStatus;
            existing.PasswordHash         = photographer.PasswordHash ?? existing.PasswordHash;
            existing.GoogleId             = photographer.GoogleId ?? existing.GoogleId;
            existing.UpdatedAt            = DateTime.UtcNow;
            existing.DeletedAt            = photographer.DeletedAt;
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    // ── Mappers ──────────────────────────────────────────────────────────────

    private static Photographer ToEntity(PhotographerRecord r) => new()
    {
        Id                   = r.Id,
        DisplayName          = r.DisplayName,
        Phone                = r.Phone,
        Email                = r.Email,
        Region               = r.Region,
        AvatarUrl            = r.AvatarUrl,
        CoverPhotoUrl        = r.CoverPhotoUrl,
        Bio                  = r.Bio,
        Quote                = r.Quote,
        InstagramUrl         = r.InstagramUrl,
        MinBudget            = r.MinBudget,
        MaxBudget            = r.MaxBudget,
        Rating               = r.Rating,
        IsPremium            = r.IsPremium,
        IsAvailable          = r.IsAvailable,
        AcceptsInstantBooking = r.AcceptsInstantBooking,
        VerificationStatus   = r.VerificationStatus,
        PasswordHash         = r.PasswordHash,
        GoogleId             = r.GoogleId,
        CreatedAt            = r.CreatedAt,
        UpdatedAt            = r.UpdatedAt,
        DeletedAt            = r.DeletedAt,
        PortfolioEmbeddings  = r.PortfolioEmbeddings
            .Select(e => System.Text.Json.JsonSerializer.Deserialize<float[]>(e.VectorJson) ?? [])
            .ToList(),
        PortfolioPhotos = r.PortfolioPhotos
            .OrderBy(x => x.DisplayOrder)
            .Select(x => x.ImageUrl)
            .ToList()
    };

    private static PhotographerRecord ToRecord(Photographer p) => new()
    {
        Id                   = p.Id,
        DisplayName          = p.DisplayName,
        Phone                = p.Phone,
        Email                = p.Email.ToLowerInvariant(),
        Region               = p.Region,
        AvatarUrl            = p.AvatarUrl,
        CoverPhotoUrl        = p.CoverPhotoUrl,
        Bio                  = p.Bio,
        Quote                = p.Quote,
        InstagramUrl         = p.InstagramUrl,
        MinBudget            = p.MinBudget,
        MaxBudget            = p.MaxBudget,
        Rating               = p.Rating,
        IsPremium            = p.IsPremium,
        IsAvailable          = p.IsAvailable,
        AcceptsInstantBooking = p.AcceptsInstantBooking,
        VerificationStatus   = p.VerificationStatus,
        PasswordHash         = p.PasswordHash,
        GoogleId             = p.GoogleId,
        CreatedAt            = p.CreatedAt,
        UpdatedAt            = p.UpdatedAt,
        DeletedAt            = p.DeletedAt
    };
}
