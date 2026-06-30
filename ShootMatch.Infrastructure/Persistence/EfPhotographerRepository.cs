using Microsoft.EntityFrameworkCore;
using ShootMatch.Application.Abstractions;
using ShootMatch.Application.Contracts;
using ShootMatch.Domain.Entities;
using ShootMatch.Infrastructure.Persistence.Entities;

namespace ShootMatch.Infrastructure.Persistence;

public sealed class EfPhotographerRepository(ShootMatchDbContext db) : IPhotographerRepository
{
    public async Task<CustomerHomeFeed> GetCustomerHomeFeedAsync(
        int photosPerPhotographer = 5,
        int latestPhotoLimit = 20,
        CancellationToken cancellationToken = default)
    {
        var perPhotographer = Math.Clamp(photosPerPhotographer, 1, 5);
        var latestLimit = Math.Clamp(latestPhotoLimit, 1, 50);

        var photographers = await db.Photographers
            .AsNoTracking()
            .Include(x => x.PortfolioPhotos)
            .Where(x => x.DeletedAt == null && x.PortfolioPhotos.Count > 0)
            .OrderByDescending(x => x.Rating)
            .ThenByDescending(x => x.UpdatedAt)
            .ToListAsync(cancellationToken);

        var featured = photographers
            .Select(p => new FeaturedPhotographerCard
            {
                Id = p.Id,
                DisplayName = p.DisplayName,
                Region = p.Region,
                AvatarUrl = string.IsNullOrWhiteSpace(p.AvatarUrl) ? null : p.AvatarUrl,
                Rating = p.Rating,
                IsPremium = p.IsPremium,
                PreviewPhotos = p.PortfolioPhotos
                    .OrderByDescending(ph => ph.CreatedAt)
                    .Take(perPhotographer)
                    .Select(ph => ph.ImageUrl)
                    .ToList()
            })
            .ToList();

        var latestPhotos = await db.PortfolioPhotos
            .AsNoTracking()
            .Include(x => x.Photographer)
            .Include(x => x.Styles)
            .Include(x => x.Concepts)
            .Where(x => x.Photographer.DeletedAt == null)
            .OrderByDescending(x => x.CreatedAt)
            .Take(latestLimit)
            .Select(x => new PortfolioFeedItem
            {
                PhotoId = x.Id,
                ImageUrl = x.ImageUrl,
                PhotographerId = x.PhotographerId,
                PhotographerName = x.Photographer.DisplayName,
                AvatarUrl = string.IsNullOrWhiteSpace(x.Photographer.AvatarUrl) ? null : x.Photographer.AvatarUrl,
                CreatedAt = x.CreatedAt,
                Styles = x.Styles.Select(s => s.Name).ToList(),
                Concepts = x.Concepts.Select(c => c.Name).ToList()
            })
            .ToListAsync(cancellationToken);

        return new CustomerHomeFeed
        {
            Featured = featured,
            LatestPhotos = latestPhotos
        };
    }

    public async Task<IReadOnlyList<Photographer>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var records = await db.Photographers
            .Include(x => x.PortfolioPhotos)
            .Include(x => x.Equipments)
            .AsNoTracking()
            .AsSplitQuery()
            .Where(x => x.DeletedAt == null)
            .ToListAsync(cancellationToken);
        return records.Select(ToEntity).ToList();
    }

    public async Task<Photographer?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var r = await db.Photographers
            .Include(x => x.PortfolioPhotos)
            .Include(x => x.Equipments)
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
            .Include(x => x.Equipments)
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
            existing.NationalId           = photographer.NationalId ?? existing.NationalId;
            existing.PersonalAddress      = photographer.PersonalAddress ?? existing.PersonalAddress;
            existing.VerificationDocumentFrontUrl = photographer.VerificationDocumentFrontUrl ?? existing.VerificationDocumentFrontUrl;
            existing.VerificationDocumentBackUrl  = photographer.VerificationDocumentBackUrl ?? existing.VerificationDocumentBackUrl;
            existing.VerificationPortraitUrl      = photographer.VerificationPortraitUrl ?? existing.VerificationPortraitUrl;
            existing.CurrentLatitude              = photographer.CurrentLatitude ?? existing.CurrentLatitude;
            existing.CurrentLongitude             = photographer.CurrentLongitude ?? existing.CurrentLongitude;
            existing.UpdatedAt                    = DateTime.UtcNow;
            existing.DeletedAt            = photographer.DeletedAt;

            // Sync Equipments
            db.PhotographerEquipments.RemoveRange(existing.Equipments);
            existing.Equipments = photographer.Equipments.Select(e => new PhotographerEquipmentRecord
            {
                Id = e.Id,
                PhotographerId = photographer.Id,
                Category = e.Category,
                Name = e.Name,
                Description = e.Description,
                IsPrimary = e.IsPrimary
            }).ToList();
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
        NationalId           = r.NationalId,
        PersonalAddress      = r.PersonalAddress,
        VerificationDocumentFrontUrl = r.VerificationDocumentFrontUrl,
        VerificationDocumentBackUrl  = r.VerificationDocumentBackUrl,
        VerificationPortraitUrl      = r.VerificationPortraitUrl,
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
        CurrentLatitude      = r.CurrentLatitude,
        CurrentLongitude     = r.CurrentLongitude,
        CreatedAt            = r.CreatedAt,
        UpdatedAt            = r.UpdatedAt,
        DeletedAt            = r.DeletedAt,
        PortfolioEmbeddings  = r.PortfolioEmbeddings
            .Select(e => System.Text.Json.JsonSerializer.Deserialize<float[]>(e.VectorJson) ?? [])
            .ToList(),
        PortfolioPhotos = r.PortfolioPhotos
            .OrderBy(x => x.DisplayOrder)
            .Select(x => x.ImageUrl)
            .ToList(),
        Equipments = r.Equipments.Select(e => new PhotographerEquipment
        {
            Id = e.Id,
            PhotographerId = e.PhotographerId,
            Category = e.Category,
            Name = e.Name,
            Description = e.Description,
            IsPrimary = e.IsPrimary
        }).ToList()
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
        NationalId           = p.NationalId,
        PersonalAddress      = p.PersonalAddress,
        VerificationDocumentFrontUrl = p.VerificationDocumentFrontUrl,
        VerificationDocumentBackUrl  = p.VerificationDocumentBackUrl,
        VerificationPortraitUrl      = p.VerificationPortraitUrl,
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
        CurrentLatitude      = p.CurrentLatitude,
        CurrentLongitude     = p.CurrentLongitude,
        CreatedAt            = p.CreatedAt,
        UpdatedAt            = p.UpdatedAt,
        DeletedAt            = p.DeletedAt,
        Equipments           = p.Equipments.Select(e => new PhotographerEquipmentRecord
        {
            Id = e.Id,
            PhotographerId = e.PhotographerId,
            Category = e.Category,
            Name = e.Name,
            Description = e.Description,
            IsPrimary = e.IsPrimary
        }).ToList()
    };
}
