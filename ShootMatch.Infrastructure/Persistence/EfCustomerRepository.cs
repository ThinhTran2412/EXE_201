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
            existing.IsVerified         = customer.IsVerified;
            existing.IsActive           = customer.IsActive;
            existing.PasswordHash       = customer.PasswordHash;
            existing.GoogleId           = customer.GoogleId;
            existing.PreferredBudgetMin = customer.PreferredBudgetMin;
            existing.PreferredBudgetMax = customer.PreferredBudgetMax;
            existing.LastSeenAt         = customer.LastSeenAt;
            existing.DeletedAt          = customer.DeletedAt;
        }

        await db.SaveChangesAsync(cancellationToken);
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
        IsVerified         = r.IsVerified,
        IsActive           = r.IsActive,
        PasswordHash       = r.PasswordHash,
        GoogleId           = r.GoogleId,
        PreferredBudgetMin = r.PreferredBudgetMin,
        PreferredBudgetMax = r.PreferredBudgetMax,
        CreatedAt          = r.CreatedAt,
        LastSeenAt         = r.LastSeenAt,
        DeletedAt          = r.DeletedAt
    };

    private static CustomerRecord ToRecord(Customer c) => new()
    {
        Id                 = c.Id,
        DisplayName        = c.DisplayName,
        Phone              = c.Phone,
        Email              = c.Email.ToLowerInvariant(),
        Region             = c.Region,
        AvatarUrl          = c.AvatarUrl,
        IsVerified         = c.IsVerified,
        IsActive           = c.IsActive,
        PasswordHash       = c.PasswordHash,
        GoogleId           = c.GoogleId,
        PreferredBudgetMin = c.PreferredBudgetMin,
        PreferredBudgetMax = c.PreferredBudgetMax,
        CreatedAt          = c.CreatedAt,
        LastSeenAt         = c.LastSeenAt,
        DeletedAt          = c.DeletedAt
    };
}
