using System.Text.Json;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;

namespace ShootMatch.Application.Services;

public sealed class NotificationService(INotificationRepository repository)
{
    public async Task<AppNotification> CreateAsync(
        Guid recipientId,
        string recipientRole,
        string category,
        string title,
        string body,
        string? actionType = null,
        object? payload = null,
        CancellationToken cancellationToken = default)
    {
        var notification = new AppNotification
        {
            Id = Guid.NewGuid(),
            RecipientId = recipientId,
            RecipientRole = recipientRole,
            Category = category,
            Title = title,
            Body = body,
            ActionType = actionType,
            PayloadJson = payload is null ? null : JsonSerializer.Serialize(payload),
            CreatedAt = DateTime.UtcNow,
        };

        await repository.SaveAsync(notification, cancellationToken);
        return notification;
    }

    public async Task<AppNotification> NotifyNewMessageAsync(
        Conversation conversation,
        Message message,
        string senderDisplayName,
        CancellationToken cancellationToken = default)
    {
        var recipientId = message.SenderRole == "customer"
            ? conversation.PhotographerId
            : conversation.CustomerId;
        var recipientRole = message.SenderRole == "customer" ? "photographer" : "customer";

        var preview = message.ContentType == "Image"
            ? "Đã gửi một ảnh"
            : (message.Content.Length > 120 ? message.Content[..120] + "…" : message.Content);

        return await CreateAsync(
            recipientId,
            recipientRole,
            "message",
            $"Tin nhắn mới từ {senderDisplayName}",
            preview,
            "open_conversation",
            new { conversationId = conversation.Id, messageId = message.Id },
            cancellationToken);
    }
}
