using ShootMatch.Application.Abstractions;
using ShootMatch.Application.Contracts;
using ShootMatch.Domain.Entities;

namespace ShootMatch.Application.Services;

public sealed class CustomerService(ICustomerRepository customerRepository)
{
    public async Task<CustomerProfile?> GetProfileAsync(Guid customerId, CancellationToken cancellationToken)
    {
        var customer = await customerRepository.GetByIdAsync(customerId, cancellationToken);
        return customer is null ? null : ToProfile(customer);
    }

    public async Task<CustomerProfile> UpsertProfileAsync(CustomerProfile profile, CancellationToken cancellationToken)
    {
        var customer = new Customer
        {
            Id = profile.Id,
            DisplayName = profile.DisplayName,
            Phone = profile.Phone,
            Email = profile.Email,
            Region = profile.Region,
            AvatarUrl = profile.AvatarUrl,
            IsVerified = profile.IsVerified,
            CreatedAt = profile.CreatedAt
        };

        await customerRepository.UpsertAsync(customer, cancellationToken);
        return ToProfile(customer);
    }

    private static CustomerProfile ToProfile(Customer customer) => new()
    {
        Id = customer.Id,
        DisplayName = customer.DisplayName,
        Phone = customer.Phone,
        Email = customer.Email,
        Region = customer.Region,
        AvatarUrl = customer.AvatarUrl,
        IsVerified = customer.IsVerified,
        CreatedAt = customer.CreatedAt
    };
}
