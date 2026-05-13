using ShootMatch.Domain.Common;
using ShootMatch.Domain.Exceptions;
using ShootMatch.Domain.ValueObjects;

namespace ShootMatch.Domain.Aggregates;

/// <summary>
/// Aggregate Root — Customer
/// Owns: SearchSession, AuthSession, SwipeAction (by ID ref — NOT loaded inline)
/// Value Objects: BudgetPreference (min/max budget), Location
/// </summary>
public sealed class CustomerAggregate : AggregateRoot
{
    // ── Identity ─────────────────────────────────────────────────────────────
    public Guid Id { get; private set; }
    public string DisplayName { get; private set; } = string.Empty;
    public string AvatarUrl { get; private set; } = string.Empty;

    // ── Value Objects ─────────────────────────────────────────────────────────
    public ContactInfo Contact { get; private set; } = null!;
    public Location? PreferredLocation { get; private set; }      // null = no region preference
    public PriceRange? BudgetPreference { get; private set; }     // null = no budget preference

    // ── Status ────────────────────────────────────────────────────────────────
    public bool IsVerified { get; private set; }
    public bool IsActive { get; private set; }

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    public DateTime CreatedAt { get; private set; }
    public DateTime? LastSeenAt { get; private set; }
    public DateTime? DeletedAt { get; private set; }
    public bool IsDeleted => DeletedAt.HasValue;

    private CustomerAggregate() { } // EF / reconstitution

    // ── Factory ───────────────────────────────────────────────────────────────

    /// <summary>Creates a new Customer after OTP verification.</summary>
    public static CustomerAggregate Register(
        string displayName,
        ContactInfo contact,
        string avatarUrl = "")
    {
        if (string.IsNullOrWhiteSpace(displayName))
            throw new DomainException("Display name is required.");

        return new CustomerAggregate
        {
            Id              = Guid.NewGuid(),
            DisplayName     = displayName.Trim(),
            Contact         = contact,
            AvatarUrl       = avatarUrl,
            IsVerified      = false,
            IsActive        = true,
            CreatedAt       = DateTime.UtcNow,
            LastSeenAt      = DateTime.UtcNow
        };
    }

    // ── Behaviour ─────────────────────────────────────────────────────────────

    /// <summary>Updates profile info.</summary>
    public void UpdateProfile(
        string displayName,
        string avatarUrl,
        Location? preferredLocation,
        PriceRange? budgetPreference)
    {
        if (IsDeleted) throw new DomainException("Cannot update a deleted customer.");
        if (string.IsNullOrWhiteSpace(displayName)) throw new DomainException("Display name is required.");

        DisplayName       = displayName.Trim();
        AvatarUrl         = avatarUrl;
        PreferredLocation = preferredLocation;
        BudgetPreference  = budgetPreference;
    }

    /// <summary>
    /// Call on every authenticated request to track engagement.
    /// Lightweight — no domain event raised (high frequency).
    /// </summary>
    public void RecordActivity() => LastSeenAt = DateTime.UtcNow;

    /// <summary>Marks the account as phone-verified (after OTP confirmed).</summary>
    public void Verify()
    {
        if (IsDeleted) throw new DomainException("Cannot verify a deleted customer.");
        IsVerified = true;
    }

    /// <summary>Soft-deactivates the account without erasing data.</summary>
    public void Deactivate()
    {
        if (IsDeleted) throw new DomainException("Account is already deleted.");
        IsActive   = false;
        DeletedAt  = DateTime.UtcNow;
    }
}
