namespace ShootMatch.Domain.Entities;

public sealed class Customer
{
    public Guid Id { get; init; }
    public string DisplayName { get; init; } = string.Empty;
    public string Phone { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Region { get; init; } = string.Empty;
    public string AvatarUrl { get; init; } = string.Empty;
    public string CoverPhotoUrl { get; init; } = string.Empty;
    public string HighlightPhoto1Url { get; init; } = string.Empty;
    public string HighlightPhoto2Url { get; init; } = string.Empty;
    public string HighlightPhoto3Url { get; init; } = string.Empty;
    public string RollPreviewPhotos { get; init; } = string.Empty;
    public string PreferredStyles { get; init; } = string.Empty;
    public bool IsVerified { get; init; }
    public decimal? PreferredBudgetMin { get; init; }
    public decimal? PreferredBudgetMax { get; init; }
    public bool IsActive { get; init; } = true;
    public string? PasswordHash { get; init; }
    public string? GoogleId { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? LastSeenAt { get; init; }
    public DateTime? DeletedAt { get; init; }
}
