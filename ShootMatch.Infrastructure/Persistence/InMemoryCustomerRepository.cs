using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;
using System.Collections.Concurrent;

namespace ShootMatch.Infrastructure.Persistence;

public sealed class InMemoryCustomerRepository : ICustomerRepository
{
    private readonly ConcurrentDictionary<Guid, Customer> _customersById = new();
    private readonly ConcurrentDictionary<string, Guid> _customerByPhone = new(StringComparer.OrdinalIgnoreCase);

    public Task<Customer?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        _customersById.TryGetValue(id, out var customer);
        return Task.FromResult(customer);
    }

    public Task<Customer?> GetByPhoneAsync(string phone, CancellationToken cancellationToken)
    {
        if (_customerByPhone.TryGetValue(phone, out var id))
        {
            _customersById.TryGetValue(id, out var customer);
            return Task.FromResult(customer);
        }

        return Task.FromResult<Customer?>(null);
    }

    public Task UpsertAsync(Customer customer, CancellationToken cancellationToken)
    {
        _customersById[customer.Id] = customer;
        _customerByPhone[customer.Phone] = customer.Id;
        return Task.CompletedTask;
    }

    public Task<Customer?> GetByEmailAsync(string email, CancellationToken cancellationToken)
    {
        var c = _customersById.Values
            .FirstOrDefault(x => x.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(c);
    }

    public Task<Customer?> GetByGoogleIdAsync(string googleId, CancellationToken cancellationToken)
    {
        var c = _customersById.Values.FirstOrDefault(x => x.GoogleId == googleId);
        return Task.FromResult(c);
    }
}
