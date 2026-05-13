namespace ShootMatch.Domain.Entities;

public sealed class Photographer
{
    public Guid Id { get; init; }
    public string DisplayName { get; init; } = string.Empty;
    public string Phone { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Region { get; init; } = string.Empty;
    public string AvatarUrl { get; init; } = string.Empty;
    public string CoverPhotoUrl { get; init; } = string.Empty;
    public string Bio { get; init; } = string.Empty;
    public string Quote { get; init; } = string.Empty;
    public string? NationalId { get; init; }
    public string? PersonalAddress { get; init; }
    public string? VerificationDocumentFrontUrl { get; init; }
    public string? VerificationDocumentBackUrl { get; init; }
    public string? VerificationPortraitUrl { get; init; }
    public string? InstagramUrl { get; init; }
    public decimal MinBudget { get; init; }
    public decimal MaxBudget { get; init; }
    public double Rating { get; init; }
    public bool IsPremium { get; init; }
    public bool IsAvailable { get; init; }
    public bool AcceptsInstantBooking { get; init; }
    public string VerificationStatus { get; init; } = "Unverified";
    public string? PasswordHash { get; init; }
    public string? GoogleId { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public DateTime? DeletedAt { get; init; }
    public IReadOnlyList<float[]> PortfolioEmbeddings { get; init; } = [];
    public List<string> PortfolioPhotos { get; init; } = [];
}
