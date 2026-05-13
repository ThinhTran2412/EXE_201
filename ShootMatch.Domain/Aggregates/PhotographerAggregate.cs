using ShootMatch.Domain.Common;
using ShootMatch.Domain.Events;
using ShootMatch.Domain.Exceptions;
using ShootMatch.Domain.ValueObjects;

namespace ShootMatch.Domain.Aggregates;

/// <summary>
/// Aggregate Root — Photographer
/// Owns: PortfolioPhoto, ServicePackage, PhotographerAvailability, VerificationRequest (by ID ref)
/// Value Objects: PriceRange, ContactInfo, Location
///
/// IsPremium is NOT a stored boolean — it is computed by checking an active PremiumSubscription
/// from outside the aggregate (query-side concern, not domain concern).
/// </summary>
public sealed class PhotographerAggregate : AggregateRoot
{
    // ── Identity ─────────────────────────────────────────────────────────────
    public Guid Id { get; private set; }
    public string DisplayName { get; private set; } = string.Empty;
    public string Bio { get; private set; } = string.Empty;
    public string AvatarUrl { get; private set; } = string.Empty;
    public string CoverPhotoUrl { get; private set; } = string.Empty;
    public string? InstagramUrl { get; private set; }

    // ── Value Objects ─────────────────────────────────────────────────────────
    public ContactInfo Contact { get; private set; } = null!;
    public Location Location { get; private set; } = null!;
    public PriceRange PriceRange { get; private set; } = null!;

    // ── Status ────────────────────────────────────────────────────────────────
    public double Rating { get; private set; }
    public bool IsAvailable { get; private set; }
    public bool AcceptsInstantBooking { get; private set; }
    public VerificationStatus VerificationStatus { get; private set; }

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }
    public DateTime? DeletedAt { get; private set; }
    public bool IsDeleted => DeletedAt.HasValue;

    // ── Child collections (loaded on demand) ─────────────────────────────────
    private readonly List<Guid> _portfolioPhotoIds = [];
    private readonly List<Guid> _servicePackageIds = [];

    public IReadOnlyList<Guid> PortfolioPhotoIds => _portfolioPhotoIds.AsReadOnly();
    public IReadOnlyList<Guid> ServicePackageIds => _servicePackageIds.AsReadOnly();

    private PhotographerAggregate() { } // EF / reconstitution

    // ── Factory ───────────────────────────────────────────────────────────────

    public static PhotographerAggregate Register(
        string displayName,
        string bio,
        ContactInfo contact,
        Location location,
        PriceRange priceRange,
        string avatarUrl,
        string coverPhotoUrl,
        string? instagramUrl,
        bool acceptsInstantBooking)
    {
        if (string.IsNullOrWhiteSpace(displayName))
            throw new DomainException("Display name is required.");

        return new PhotographerAggregate
        {
            Id                   = Guid.NewGuid(),
            DisplayName          = displayName.Trim(),
            Bio                  = bio.Trim(),
            Contact              = contact,
            Location             = location,
            PriceRange           = priceRange,
            AvatarUrl            = avatarUrl,
            CoverPhotoUrl        = coverPhotoUrl,
            InstagramUrl         = instagramUrl,
            AcceptsInstantBooking = acceptsInstantBooking,
            Rating               = 0d,
            IsAvailable          = true,
            VerificationStatus   = VerificationStatus.Unverified,
            CreatedAt            = DateTime.UtcNow,
            UpdatedAt            = DateTime.UtcNow
        };
    }

    // ── Behaviour ─────────────────────────────────────────────────────────────

    /// <summary>Updates profile info. Stamps UpdatedAt.</summary>
    public void UpdateProfile(
        string displayName,
        string bio,
        string avatarUrl,
        string coverPhotoUrl,
        string? instagramUrl,
        PriceRange priceRange,
        bool acceptsInstantBooking)
    {
        if (IsDeleted) throw new DomainException("Cannot update a deleted photographer profile.");
        if (string.IsNullOrWhiteSpace(displayName)) throw new DomainException("Display name is required.");

        DisplayName           = displayName.Trim();
        Bio                   = bio.Trim();
        AvatarUrl             = avatarUrl;
        CoverPhotoUrl         = coverPhotoUrl;
        InstagramUrl          = instagramUrl;
        PriceRange            = priceRange;
        AcceptsInstantBooking = acceptsInstantBooking;
        UpdatedAt             = DateTime.UtcNow;
    }

    /// <summary>Toggles availability. Photographers who are unavailable are hidden from swipe feed.</summary>
    public void SetAvailability(bool isAvailable)
    {
        if (IsDeleted) throw new DomainException("Cannot update a deleted photographer profile.");
        IsAvailable = isAvailable;
        UpdatedAt   = DateTime.UtcNow;
    }

    /// <summary>
    /// Called by admin when a VerificationRequest is approved.
    /// Raises PhotographerVerified → boosts visibility in ranking.
    /// </summary>
    public void MarkVerified(Guid verificationRequestId)
    {
        if (VerificationStatus == VerificationStatus.Verified)
            throw new DomainException("Photographer is already verified.");

        VerificationStatus = VerificationStatus.Verified;
        UpdatedAt          = DateTime.UtcNow;
        RaiseDomainEvent(new PhotographerVerified(Id, verificationRequestId, DateTime.UtcNow));
    }

    /// <summary>Submits to verification queue — sets status to Pending.</summary>
    public void SubmitForVerification()
    {
        if (IsDeleted) throw new DomainException("Cannot submit a deleted profile for verification.");
        if (VerificationStatus == VerificationStatus.Verified)
            throw new DomainException("Profile is already verified.");

        VerificationStatus = VerificationStatus.Pending;
        UpdatedAt          = DateTime.UtcNow;
    }

    /// <summary>
    /// Updates the aggregate rating. Called after a new Review is saved.
    /// newRating is the pre-calculated aggregate (e.g. rolling average from DB).
    /// </summary>
    public void UpdateRating(double newRating)
    {
        if (newRating is < 0 or > 5)
            throw new DomainException("Rating must be between 0 and 5.");

        Rating    = Math.Round(newRating, 2);
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>Soft delete — profile hidden but data preserved for audit.</summary>
    public void Delete()
    {
        if (IsDeleted) throw new DomainException("Profile is already deleted.");
        DeletedAt   = DateTime.UtcNow;
        IsAvailable = false;
        UpdatedAt   = DateTime.UtcNow;
    }

    // ── Portfolio photo tracking (IDs only — photos loaded separately) ────────

    public void AddPortfolioPhoto(Guid photoId)
    {
        if (IsDeleted) throw new DomainException("Cannot modify a deleted photographer profile.");
        if (_portfolioPhotoIds.Contains(photoId))
            throw new DomainException("Photo already registered in portfolio.");

        _portfolioPhotoIds.Add(photoId);
        UpdatedAt = DateTime.UtcNow;
    }

    public void RemovePortfolioPhoto(Guid photoId)
    {
        if (!_portfolioPhotoIds.Remove(photoId))
            throw new DomainException("Photo not found in portfolio.");
        UpdatedAt = DateTime.UtcNow;
    }
}

public enum VerificationStatus { Unverified, Pending, Verified }
