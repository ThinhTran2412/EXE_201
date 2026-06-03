using Microsoft.EntityFrameworkCore;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;
using ShootMatch.Infrastructure.Persistence.Entities;

namespace ShootMatch.Infrastructure.Persistence;

public sealed class EfStaffRepository(ShootMatchDbContext db) : IStaffRepository
{
    public async Task<IReadOnlyList<Staff>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var records = await db.Staffs
            .AsNoTracking()
            .Where(x => x.DeletedAt == null)
            .ToListAsync(cancellationToken);
        return records.Select(ToEntity).ToList();
    }

    public async Task<IReadOnlyList<Staff>> GetPendingAsync(CancellationToken cancellationToken = default)
    {
        var records = await db.Staffs
            .AsNoTracking()
            .Where(x => x.DeletedAt == null && x.ApprovalStatus == "Pending")
            .ToListAsync(cancellationToken);
        return records.Select(ToEntity).ToList();
    }

    public async Task<Staff?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var record = await db.Staffs.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id && x.DeletedAt == null, cancellationToken);
        return record is null ? null : ToEntity(record);
    }

    public async Task<Staff?> GetByPhoneAsync(string phone, CancellationToken cancellationToken = default)
    {
        var record = await db.Staffs.AsNoTracking().FirstOrDefaultAsync(x => x.Phone == phone && x.DeletedAt == null, cancellationToken);
        return record is null ? null : ToEntity(record);
    }

    public async Task<Staff?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalised = email.ToLowerInvariant();
        var record = await db.Staffs.AsNoTracking().FirstOrDefaultAsync(x => x.Email == normalised && x.DeletedAt == null, cancellationToken);
        return record is null ? null : ToEntity(record);
    }

    public async Task<Staff?> GetByGoogleIdAsync(string googleId, CancellationToken cancellationToken = default)
    {
        var record = await db.Staffs.AsNoTracking().FirstOrDefaultAsync(x => x.GoogleId == googleId && x.DeletedAt == null, cancellationToken);
        return record is null ? null : ToEntity(record);
    }

    public async Task UpsertAsync(Staff staff, CancellationToken cancellationToken = default)
    {
        var existing = await db.Staffs.FirstOrDefaultAsync(x => x.Id == staff.Id, cancellationToken);
        if (existing is null)
        {
            await db.Staffs.AddAsync(ToRecord(staff), cancellationToken);
        }
        else
        {
            existing.DisplayName = staff.DisplayName;
            existing.Phone = staff.Phone;
            existing.Email = staff.Email.ToLowerInvariant();
            existing.Role = staff.Role;
            existing.ApprovalStatus = staff.ApprovalStatus;
            existing.PasswordHash = staff.PasswordHash;
            existing.GoogleId = staff.GoogleId;
            existing.UpdatedAt = staff.UpdatedAt;
            existing.ApprovedAt = staff.ApprovedAt;
            existing.ApprovedBy = staff.ApprovedBy;
            existing.DeletedAt = staff.DeletedAt;
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private static Staff ToEntity(StaffRecord r) => new()
    {
        Id = r.Id,
        DisplayName = r.DisplayName,
        Phone = r.Phone,
        Email = r.Email,
        Role = r.Role,
        ApprovalStatus = r.ApprovalStatus,
        PasswordHash = r.PasswordHash,
        GoogleId = r.GoogleId,
        CreatedAt = r.CreatedAt,
        UpdatedAt = r.UpdatedAt,
        ApprovedAt = r.ApprovedAt,
        ApprovedBy = r.ApprovedBy,
        DeletedAt = r.DeletedAt
    };

    private static StaffRecord ToRecord(Staff s) => new()
    {
        Id = s.Id,
        DisplayName = s.DisplayName,
        Phone = s.Phone,
        Email = s.Email.ToLowerInvariant(),
        Role = s.Role,
        ApprovalStatus = s.ApprovalStatus,
        PasswordHash = s.PasswordHash,
        GoogleId = s.GoogleId,
        CreatedAt = s.CreatedAt,
        UpdatedAt = s.UpdatedAt,
        ApprovedAt = s.ApprovedAt,
        ApprovedBy = s.ApprovedBy,
        DeletedAt = s.DeletedAt
    };
}