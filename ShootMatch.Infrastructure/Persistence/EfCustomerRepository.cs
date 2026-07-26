using Microsoft.EntityFrameworkCore;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;
using ShootMatch.Infrastructure.Persistence.Entities;

namespace ShootMatch.Infrastructure.Persistence;

/// <summary>
/// EF Core implementation of ICustomerRepository backed by PostgreSQL.
/// Replaces InMemoryCustomerRepository for production use.
/// </summary>
public sealed class EfCustomerRepository(ShootMatchDbContext db) : ICustomerRepository
{
    public async Task<Customer?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var record = await db.Customers.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.DeletedAt == null, cancellationToken);
        return record is null ? null : ToEntity(record);
    }

    public async Task<Customer?> GetByPhoneAsync(string phone, CancellationToken cancellationToken)
    {
        var record = await db.Customers.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Phone == phone && x.DeletedAt == null, cancellationToken);
        return record is null ? null : ToEntity(record);
    }

    public async Task<Customer?> GetByEmailAsync(string email, CancellationToken cancellationToken)
    {
        var normalised = email.ToLowerInvariant();
        var record = await db.Customers.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Email == normalised && x.DeletedAt == null, cancellationToken);
        return record is null ? null : ToEntity(record);
    }

    public async Task<Customer?> GetByGoogleIdAsync(string googleId, CancellationToken cancellationToken)
    {
        var record = await db.Customers.AsNoTracking()
            .FirstOrDefaultAsync(x => x.GoogleId == googleId && x.DeletedAt == null, cancellationToken);
        return record is null ? null : ToEntity(record);
    }

    public async Task UpsertAsync(Customer customer, CancellationToken cancellationToken)
    {
        var existing = await db.Customers
            .FirstOrDefaultAsync(x => x.Id == customer.Id, cancellationToken);

        if (existing is null)
        {
            await db.Customers.AddAsync(ToRecord(customer), cancellationToken);
        }
        else
        {
            // Update all mutable fields
            existing.DisplayName        = customer.DisplayName;
            existing.Phone              = customer.Phone;
            existing.Email              = customer.Email.ToLowerInvariant();
            existing.Region             = customer.Region;
            existing.AvatarUrl          = customer.AvatarUrl;
            existing.CoverPhotoUrl      = customer.CoverPhotoUrl;
            existing.HighlightPhoto1Url = customer.HighlightPhoto1Url;
            existing.HighlightPhoto2Url = customer.HighlightPhoto2Url;
            existing.HighlightPhoto3Url = customer.HighlightPhoto3Url;
            existing.RollPreviewPhotos  = customer.RollPreviewPhotos;
            existing.PreferredStyles    = customer.PreferredStyles;
            existing.IsVerified         = customer.IsVerified;
            existing.IsActive           = customer.IsActive;
            existing.PasswordHash       = customer.PasswordHash;
            existing.GoogleId           = customer.GoogleId;
            existing.PreferredBudgetMin = customer.PreferredBudgetMin;
            existing.PreferredBudgetMax = customer.PreferredBudgetMax;
            existing.LastSeenAt         = customer.LastSeenAt;
            existing.DeletedAt          = customer.DeletedAt;
            existing.MembershipTier     = customer.MembershipTier;
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Customer>> GetAllAsync(CancellationToken cancellationToken)
    {
        var records = await db.Customers.AsNoTracking().Where(x => x.DeletedAt == null).ToListAsync(cancellationToken);
        return records.Select(ToEntity).ToList();
    }

    // ── Mappers ──────────────────────────────────────────────────────────────

    private static Customer ToEntity(CustomerRecord r) => new()
    {
        Id                 = r.Id,
        DisplayName        = r.DisplayName,
        Phone              = r.Phone,
        Email              = r.Email,
        Region             = r.Region,
        AvatarUrl          = r.AvatarUrl,
        CoverPhotoUrl      = r.CoverPhotoUrl,
        HighlightPhoto1Url = r.HighlightPhoto1Url,
        HighlightPhoto2Url = r.HighlightPhoto2Url,
        HighlightPhoto3Url = r.HighlightPhoto3Url,
        RollPreviewPhotos  = r.RollPreviewPhotos,
        PreferredStyles    = r.PreferredStyles,
        IsVerified         = r.IsVerified,
        IsActive           = r.IsActive,
        PasswordHash       = r.PasswordHash,
        GoogleId           = r.GoogleId,
        PreferredBudgetMin = r.PreferredBudgetMin,
        PreferredBudgetMax = r.PreferredBudgetMax,
        CreatedAt          = r.CreatedAt,
        LastSeenAt         = r.LastSeenAt,
        DeletedAt          = r.DeletedAt,
        MembershipTier     = r.MembershipTier
    };

    private static CustomerRecord ToRecord(Customer c) => new()
    {
        Id                 = c.Id,
        DisplayName        = c.DisplayName,
        Phone              = c.Phone,
        Email              = c.Email.ToLowerInvariant(),
        Region             = c.Region,
        AvatarUrl          = c.AvatarUrl,
        CoverPhotoUrl      = c.CoverPhotoUrl,
        HighlightPhoto1Url = c.HighlightPhoto1Url,
        HighlightPhoto2Url = c.HighlightPhoto2Url,
        HighlightPhoto3Url = c.HighlightPhoto3Url,
        RollPreviewPhotos  = c.RollPreviewPhotos,
        PreferredStyles    = c.PreferredStyles,
        IsVerified         = c.IsVerified,
        IsActive           = c.IsActive,
        PasswordHash       = c.PasswordHash,
        GoogleId           = c.GoogleId,
        PreferredBudgetMin = c.PreferredBudgetMin,
        PreferredBudgetMax = c.PreferredBudgetMax,
        CreatedAt          = c.CreatedAt,
        LastSeenAt         = c.LastSeenAt,
        DeletedAt          = c.DeletedAt,
        MembershipTier     = c.MembershipTier
    };
}
