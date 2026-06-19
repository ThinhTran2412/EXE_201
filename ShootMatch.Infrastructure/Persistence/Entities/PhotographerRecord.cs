namespace ShootMatch.Infrastructure.Persistence.Entities;

public sealed class PhotographerRecord
{
    public Guid Id { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string AvatarUrl { get; set; } = string.Empty;
    public string CoverPhotoUrl { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string Quote { get; set; } = string.Empty;
    public string? NationalId { get; set; }
    public string? PersonalAddress { get; set; }
    public string? VerificationDocumentFrontUrl { get; set; }
    public string? VerificationDocumentBackUrl { get; set; }
    public string? VerificationPortraitUrl { get; set; }
    public string? InstagramUrl { get; set; }
    public decimal MinBudget { get; set; }
    public decimal MaxBudget { get; set; }
    public double Rating { get; set; }
    public bool IsPremium { get; set; }
    public bool IsAvailable { get; set; }
    public bool AcceptsInstantBooking { get; set; }
    public string VerificationStatus { get; set; } = "Unverified";
    public string? PasswordHash { get; set; }
    public string? GoogleId { get; set; }
    public double? CurrentLatitude { get; set; }
    public double? CurrentLongitude { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
    public ICollection<PortfolioEmbeddingRecord> PortfolioEmbeddings { get; set; } = [];
    public ICollection<PortfolioPhotoRecord> PortfolioPhotos { get; set; } = [];
    public ICollection<ServicePackageRecord> ServicePackages { get; set; } = [];
    public ICollection<PhotographerAvailabilityRecord> Availabilities { get; set; } = [];
    public ICollection<StyleRecord> Styles { get; set; } = [];
    public ICollection<ConceptRecord> Concepts { get; set; } = [];
    public ICollection<PhotographerEquipmentRecord> Equipments { get; set; } = [];
}
