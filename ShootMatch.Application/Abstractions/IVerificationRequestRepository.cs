using ShootMatch.Domain.Entities;

namespace ShootMatch.Application.Abstractions;

public interface IVerificationRequestRepository
{
    Task SaveAsync(VerificationRequest request, CancellationToken cancellationToken = default);
    Task<VerificationRequest?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<VerificationRequest?> GetPendingByPhotographerIdAsync(Guid photographerId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<VerificationRequest>> GetAllPendingAsync(CancellationToken cancellationToken = default);
}
