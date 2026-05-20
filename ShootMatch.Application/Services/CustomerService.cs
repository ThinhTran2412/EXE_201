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
        var existing = await customerRepository.GetByIdAsync(profile.Id, cancellationToken);

        var customer = new Customer
        {
            Id = profile.Id,
            DisplayName = profile.DisplayName,
            Phone = profile.Phone,
            Email = profile.Email,
            Region = profile.Region,
            AvatarUrl = profile.AvatarUrl,
            CoverPhotoUrl = profile.CoverPhotoUrl,
            HighlightPhoto1Url = profile.HighlightPhoto1Url,
            HighlightPhoto2Url = profile.HighlightPhoto2Url,
            HighlightPhoto3Url = profile.HighlightPhoto3Url,
            RollPreviewPhotos = profile.RollPreviewPhotos,
            PreferredStyles = profile.PreferredStyles,
            IsVerified = existing?.IsVerified ?? profile.IsVerified,
            IsActive = existing?.IsActive ?? true,
            PasswordHash = existing?.PasswordHash,
            GoogleId = existing?.GoogleId,
            PreferredBudgetMin = existing?.PreferredBudgetMin,
            PreferredBudgetMax = existing?.PreferredBudgetMax,
            CreatedAt = existing?.CreatedAt ?? profile.CreatedAt,
            LastSeenAt = existing?.LastSeenAt,
            DeletedAt = existing?.DeletedAt,
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
        CoverPhotoUrl = customer.CoverPhotoUrl,
        HighlightPhoto1Url = customer.HighlightPhoto1Url,
        HighlightPhoto2Url = customer.HighlightPhoto2Url,
        HighlightPhoto3Url = customer.HighlightPhoto3Url,
        RollPreviewPhotos = customer.RollPreviewPhotos,
        PreferredStyles = customer.PreferredStyles,
        IsVerified = customer.IsVerified,
        CreatedAt = customer.CreatedAt
    };
}
