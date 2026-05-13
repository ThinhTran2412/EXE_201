namespace ShootMatch.Api.Contracts;

public sealed class UpsertCustomerProfileRequest
{
    public string DisplayName { get; init; } = string.Empty;
    public string Phone { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Region { get; init; } = string.Empty;
    public string AvatarUrl { get; init; } = string.Empty;
}
