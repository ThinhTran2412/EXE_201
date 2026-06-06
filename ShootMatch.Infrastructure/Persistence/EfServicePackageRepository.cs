using Microsoft.EntityFrameworkCore;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;
using ShootMatch.Infrastructure.Persistence.Entities;

namespace ShootMatch.Infrastructure.Persistence;

public sealed class EfServicePackageRepository(ShootMatchDbContext db) : IServicePackageRepository
{
    public async Task<IReadOnlyList<ServicePackage>> GetByPhotographerIdAsync(Guid photographerId, CancellationToken cancellationToken = default)
    {
        var records = await db.ServicePackages
            .AsNoTracking()
            .Include(x => x.Media)
            .Where(x => x.PhotographerId == photographerId)
            .OrderByDescending(x => x.IsActive)
            .ThenBy(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        return records.Select(ToEntity).ToList();
    }

    public async Task<ServicePackage?> GetByIdAsync(Guid photographerId, Guid packageId, CancellationToken cancellationToken = default)
    {
        var record = await db.ServicePackages
            .AsNoTracking()
            .Include(x => x.Media)
            .FirstOrDefaultAsync(x => x.PhotographerId == photographerId && x.Id == packageId, cancellationToken);

        return record is null ? null : ToEntity(record);
    }

    public async Task UpsertAsync(ServicePackage servicePackage, CancellationToken cancellationToken = default)
    {
        var record = await db.ServicePackages
            .Include(x => x.Media)
            .FirstOrDefaultAsync(x => x.PhotographerId == servicePackage.PhotographerId && x.Id == servicePackage.Id, cancellationToken);

        if (record is null)
        {
            record = new ServicePackageRecord
            {
                Id = servicePackage.Id == Guid.Empty ? Guid.NewGuid() : servicePackage.Id,
                PhotographerId = servicePackage.PhotographerId,
                CreatedAt = servicePackage.CreatedAt == default ? DateTime.UtcNow : servicePackage.CreatedAt,
            };
            db.ServicePackages.Add(record);
        }

        record.Title = servicePackage.Title;
        record.Subtitle = servicePackage.Subtitle;
        record.Description = servicePackage.Description;
        record.HeroTitle = servicePackage.HeroTitle;
        record.HeroSubtitle = servicePackage.HeroSubtitle;
        record.CallToAction = servicePackage.CallToAction;
        record.Price = servicePackage.Price;
        record.DurationHours = servicePackage.DurationHours;
        record.LocationType = servicePackage.LocationType;
        record.AgeGroup = servicePackage.AgeGroup;
        record.GroupSize = servicePackage.GroupSize;
        record.IsActive = servicePackage.IsActive;
        record.UpdatedAt = DateTime.UtcNow;

        // Remove old media (tracked entities from Include) so EF issues DELETEs, not UPDATEs
        if (record.Media is { Count: > 0 })
        {
            db.Set<ServicePackageMediaRecord>().RemoveRange(record.Media);
            record.Media.Clear();
        }

        // Add new media directly to the DbSet (avoid nav-collection tracking issues)
        foreach (var media in servicePackage.Media.OrderBy(x => x.SortOrder))
        {
            db.Set<ServicePackageMediaRecord>().Add(new ServicePackageMediaRecord
            {
                Id = Guid.NewGuid(),
                ServicePackageId = record.Id,
                ImageUrl = media.ImageUrl,
                SortOrder = media.SortOrder,
            });
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid photographerId, Guid packageId, CancellationToken cancellationToken = default)
    {
        var record = await db.ServicePackages.FirstOrDefaultAsync(x => x.PhotographerId == photographerId && x.Id == packageId, cancellationToken);
        if (record is null) return;
        db.ServicePackages.Remove(record);
        await db.SaveChangesAsync(cancellationToken);
    }

    private static ServicePackage ToEntity(ServicePackageRecord r) => new()
    {
        Id = r.Id,
        PhotographerId = r.PhotographerId,
        Title = r.Title,
        Subtitle = r.Subtitle,
        Description = r.Description,
        HeroTitle = r.HeroTitle,
        HeroSubtitle = r.HeroSubtitle,
        CallToAction = r.CallToAction,
        Price = r.Price,
        DurationHours = r.DurationHours,
        LocationType = r.LocationType,
        AgeGroup = r.AgeGroup,
        GroupSize = r.GroupSize,
        IsActive = r.IsActive,
        CreatedAt = r.CreatedAt,
        UpdatedAt = r.UpdatedAt,
        Media = r.Media.OrderBy(x => x.SortOrder).Select(x => new ServicePackageMedia
        {
            Id = x.Id,
            ServicePackageId = x.ServicePackageId,
            ImageUrl = x.ImageUrl,
            SortOrder = x.SortOrder,
        }).ToList(),
    };
}
