namespace ShootMatch.Application.Contracts;

public sealed class CustomerProfile
{
    public required Guid Id { get; init; }
    public required string DisplayName { get; init; }
    public required string Phone { get; init; }
    public required string Email { get; init; }
    public required string Region { get; init; }
    public required string AvatarUrl { get; init; }
    public required bool IsVerified { get; init; }
    public required DateTime CreatedAt { get; init; }
}
