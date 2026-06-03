using ShootMatch.Domain.Entities;

namespace ShootMatch.Application.Abstractions;

public interface IStaffRepository
{
    Task<IReadOnlyList<Staff>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Staff>> GetPendingAsync(CancellationToken cancellationToken = default);
    Task<Staff?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Staff?> GetByPhoneAsync(string phone, CancellationToken cancellationToken = default);
    Task<Staff?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<Staff?> GetByGoogleIdAsync(string googleId, CancellationToken cancellationToken = default);
    Task UpsertAsync(Staff staff, CancellationToken cancellationToken = default);
}