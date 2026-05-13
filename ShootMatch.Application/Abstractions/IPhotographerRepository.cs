using ShootMatch.Domain.Entities;

namespace ShootMatch.Application.Abstractions;

public interface IPhotographerRepository
{
    Task<IReadOnlyList<Photographer>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Photographer?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Photographer?> GetByPhoneAsync(string phone, CancellationToken cancellationToken = default);
    Task<Photographer?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<Photographer?> GetByGoogleIdAsync(string googleId, CancellationToken cancellationToken = default);
    Task UpsertAsync(Photographer photographer, CancellationToken cancellationToken = default);
}
