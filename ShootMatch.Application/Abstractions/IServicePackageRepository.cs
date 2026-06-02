using ShootMatch.Domain.Entities;

namespace ShootMatch.Application.Abstractions;

public interface IServicePackageRepository
{
    Task<IReadOnlyList<ServicePackage>> GetByPhotographerIdAsync(
        Guid photographerId,
        CancellationToken cancellationToken = default);

    Task<ServicePackage?> GetByIdAsync(
        Guid photographerId,
        Guid packageId,
        CancellationToken cancellationToken = default);

    Task UpsertAsync(
        ServicePackage servicePackage,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        Guid photographerId,
        Guid packageId,
        CancellationToken cancellationToken = default);
}
