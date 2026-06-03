namespace ShootMatch.Domain.Entities;

public sealed class Staff
{
    public Guid Id { get; init; }
    public string DisplayName { get; init; } = string.Empty;
    public string Phone { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Role { get; init; } = "staff";
    public string ApprovalStatus { get; init; } = "Pending";
    public string? PasswordHash { get; init; }
    public string? GoogleId { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public DateTime? ApprovedAt { get; init; }
    public string? ApprovedBy { get; init; }
    public DateTime? DeletedAt { get; init; }
}