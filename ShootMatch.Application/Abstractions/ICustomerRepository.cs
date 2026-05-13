using ShootMatch.Domain.Entities;

namespace ShootMatch.Application.Abstractions;

public interface ICustomerRepository
{
    Task<Customer?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<Customer?> GetByPhoneAsync(string phone, CancellationToken cancellationToken);
    Task<Customer?> GetByEmailAsync(string email, CancellationToken cancellationToken);
    Task<Customer?> GetByGoogleIdAsync(string googleId, CancellationToken cancellationToken);
    Task UpsertAsync(Customer customer, CancellationToken cancellationToken);
}
