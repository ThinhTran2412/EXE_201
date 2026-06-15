using Microsoft.AspNetCore.SignalR;
using ShootMatch.Api.Hubs;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;

namespace ShootMatch.Api.Services;

public sealed class RealtimeNotificationPublisher(IHubContext<ChatHub> hubContext) : IRealtimeNotificationPublisher
{
    public async Task PublishNotificationAsync(AppNotification notification, CancellationToken cancellationToken = default)
    {
        await hubContext.Clients.User(notification.RecipientId.ToString())
            .SendAsync("ReceiveNotification", new
            {
                id = notification.Id,
                category = notification.Category,
                title = notification.Title,
                body = notification.Body,
                payloadJson = notification.PayloadJson,
                actionType = notification.ActionType,
                createdAt = notification.CreatedAt
            }, cancellationToken);
    }
}
