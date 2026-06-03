using Microsoft.EntityFrameworkCore;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;
using ShootMatch.Infrastructure.Persistence.Entities;

namespace ShootMatch.Infrastructure.Persistence;

public sealed class EfPhotographerAvailabilityRepository(ShootMatchDbContext db) : IPhotographerAvailabilityRepository
{
    public async Task<IReadOnlyList<PhotographerAvailability>> GetByPhotographerIdAsync(
        Guid photographerId,
        DateOnly? from = null,
        DateOnly? to = null,
        CancellationToken cancellationToken = default)
    {
        var query = db.PhotographerAvailabilities
            .AsNoTracking()
            .Where(x => x.PhotographerId == photographerId);

        if (from is not null)
            query = query.Where(x => x.SpecificDate == null || x.SpecificDate >= from);
        if (to is not null)
            query = query.Where(x => x.SpecificDate == null || x.SpecificDate <= to);

        var records = await query
            .OrderByDescending(x => x.SpecificDate)
            .ThenBy(x => x.DayOfWeek)
            .ThenBy(x => x.StartTime)
            .ToListAsync(cancellationToken);

        return records.Select(ToEntity).ToList();
    }

    public async Task UpsertBlocksAsync(
        Guid photographerId,
        IReadOnlyList<PhotographerAvailability> blocks,
        CancellationToken cancellationToken = default)
    {
        foreach (var block in blocks)
        {
            var existing = await db.PhotographerAvailabilities.FirstOrDefaultAsync(
                x => x.PhotographerId == photographerId
                  && x.SpecificDate == block.SpecificDate
                  && x.StartTime == block.StartTime,
                cancellationToken);

            if (existing is null)
            {
                await db.PhotographerAvailabilities.AddAsync(new PhotographerAvailabilityRecord
                {
                    Id = block.Id == Guid.Empty ? Guid.NewGuid() : block.Id,
                    PhotographerId = photographerId,
                    DayOfWeek = block.DayOfWeek,
                    SpecificDate = block.SpecificDate,
                    StartTime = block.StartTime,
                    EndTime = block.EndTime,
                    SlotType = block.SlotType,
                    CreatedAt = block.CreatedAt == default ? DateTime.UtcNow : block.CreatedAt,
                }, cancellationToken);
            }
            else
            {
                existing.DayOfWeek = block.DayOfWeek;
                existing.SpecificDate = block.SpecificDate;
                existing.StartTime = block.StartTime;
                existing.EndTime = block.EndTime;
                existing.SlotType = block.SlotType;
            }
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteBlocksAsync(
        Guid photographerId,
        DateOnly specificDate,
        IReadOnlyCollection<TimeOnly> startTimes,
        CancellationToken cancellationToken = default)
    {
        var records = await db.PhotographerAvailabilities
            .Where(x => x.PhotographerId == photographerId && x.SpecificDate == specificDate && startTimes.Contains(x.StartTime))
            .ToListAsync(cancellationToken);

        db.PhotographerAvailabilities.RemoveRange(records);
        await db.SaveChangesAsync(cancellationToken);
    }

    private static PhotographerAvailability ToEntity(PhotographerAvailabilityRecord r) => new()
    {
        Id = r.Id,
        PhotographerId = r.PhotographerId,
        DayOfWeek = r.DayOfWeek,
        SpecificDate = r.SpecificDate,
        StartTime = r.StartTime,
        EndTime = r.EndTime,
        SlotType = r.SlotType,
        CreatedAt = r.CreatedAt,
    };
}
