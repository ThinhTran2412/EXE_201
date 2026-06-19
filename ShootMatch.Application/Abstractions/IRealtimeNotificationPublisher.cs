using ShootMatch.Domain.Entities;

namespace ShootMatch.Application.Abstractions;

public interface IRealtimeNotificationPublisher
{
    Task PublishNotificationAsync(AppNotification notification, CancellationToken cancellationToken = default);
}
