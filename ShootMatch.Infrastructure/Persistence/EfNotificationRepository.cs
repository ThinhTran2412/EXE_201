using Microsoft.EntityFrameworkCore;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;
using ShootMatch.Infrastructure.Persistence.Entities;

namespace ShootMatch.Infrastructure.Persistence;

public sealed class EfNotificationRepository(ShootMatchDbContext db) : INotificationRepository
{
    public async Task SaveAsync(AppNotification notification, CancellationToken cancellationToken = default)
    {
        await db.AppNotifications.AddAsync(new AppNotificationRecord
        {
            Id = notification.Id,
            RecipientId = notification.RecipientId,
            RecipientRole = notification.RecipientRole,
            Category = notification.Category,
            Title = notification.Title,
            Body = notification.Body,
            PayloadJson = notification.PayloadJson,
            ActionType = notification.ActionType,
            CreatedAt = notification.CreatedAt,
            ReadAt = notification.ReadAt,
        }, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<AppNotification>> GetForRecipientAsync(
        Guid recipientId,
        string recipientRole,
        int skip,
        int take,
        CancellationToken cancellationToken = default)
        => (await db.AppNotifications.AsNoTracking()
            .Where(x => x.RecipientId == recipientId && x.RecipientRole == recipientRole)
            .OrderByDescending(x => x.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync(cancellationToken))
            .Select(ToEntity)
            .ToList();

    public Task<int> GetUnreadCountAsync(Guid recipientId, string recipientRole, CancellationToken cancellationToken = default)
        => db.AppNotifications.CountAsync(
            x => x.RecipientId == recipientId && x.RecipientRole == recipientRole && x.ReadAt == null,
            cancellationToken);

    public async Task<bool> MarkReadAsync(Guid notificationId, Guid recipientId, CancellationToken cancellationToken = default)
    {
        var row = await db.AppNotifications.FirstOrDefaultAsync(
            x => x.Id == notificationId && x.RecipientId == recipientId, cancellationToken);
        if (row is null || row.ReadAt.HasValue) return false;
        row.ReadAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<int> MarkAllReadAsync(Guid recipientId, string recipientRole, CancellationToken cancellationToken = default)
    {
        var rows = await db.AppNotifications
            .Where(x => x.RecipientId == recipientId && x.RecipientRole == recipientRole && x.ReadAt == null)
            .ToListAsync(cancellationToken);
        var now = DateTime.UtcNow;
        foreach (var row in rows) row.ReadAt = now;
        await db.SaveChangesAsync(cancellationToken);
        return rows.Count;
    }

    private static AppNotification ToEntity(AppNotificationRecord r) => new()
    {
        Id = r.Id,
        RecipientId = r.RecipientId,
        RecipientRole = r.RecipientRole,
        Category = r.Category,
        Title = r.Title,
        Body = r.Body,
        PayloadJson = r.PayloadJson,
        ActionType = r.ActionType,
        CreatedAt = r.CreatedAt,
        ReadAt = r.ReadAt,
    };
}
