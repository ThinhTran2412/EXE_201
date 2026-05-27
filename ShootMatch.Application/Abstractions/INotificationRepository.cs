using ShootMatch.Domain.Entities;

namespace ShootMatch.Application.Abstractions;

public interface INotificationRepository
{
    Task SaveAsync(AppNotification notification, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AppNotification>> GetForRecipientAsync(
        Guid recipientId,
        string recipientRole,
        int skip,
        int take,
        CancellationToken cancellationToken = default);
    Task<int> GetUnreadCountAsync(Guid recipientId, string recipientRole, CancellationToken cancellationToken = default);
    Task<bool> MarkReadAsync(Guid notificationId, Guid recipientId, CancellationToken cancellationToken = default);
    Task<int> MarkAllReadAsync(Guid recipientId, string recipientRole, CancellationToken cancellationToken = default);
}
