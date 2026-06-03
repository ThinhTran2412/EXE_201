using ShootMatch.Domain.Entities;

namespace ShootMatch.Application.Abstractions;

public interface IPhotographerAvailabilityRepository
{
    Task<IReadOnlyList<PhotographerAvailability>> GetByPhotographerIdAsync(
        Guid photographerId,
        DateOnly? from = null,
        DateOnly? to = null,
        CancellationToken cancellationToken = default);

    Task UpsertBlocksAsync(
        Guid photographerId,
        IReadOnlyList<PhotographerAvailability> blocks,
        CancellationToken cancellationToken = default);

    Task DeleteBlocksAsync(
        Guid photographerId,
        DateOnly specificDate,
        IReadOnlyCollection<TimeOnly> startTimes,
        CancellationToken cancellationToken = default);
}
