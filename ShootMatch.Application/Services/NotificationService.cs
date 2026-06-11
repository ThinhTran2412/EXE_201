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

    public Task<AppNotification> NotifyNewMessageAsync(
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

        return CreateAsync(
            recipientId,
            recipientRole,
            "message",
            $"Tin nhắn mới từ {senderDisplayName}",
            preview,
            "open_conversation",
            new { conversationId = conversation.Id, messageId = message.Id },
            cancellationToken);
    }

    public Task<AppNotification> NotifyBookingCreatedAsync(
        Guid photographerId,
        Guid bookingId,
        DateTime scheduledAt,
        CancellationToken cancellationToken = default)
        => CreateAsync(
            photographerId,
            "photographer",
            "booking",
            "Có booking mới",
            $"Một booking mới đã được tạo cho lịch {scheduledAt:dd/MM/yyyy HH:mm}.",
            "open_booking",
            new { bookingId },
            cancellationToken);

    public Task<AppNotification> NotifyBookingConfirmedAsync(
        Guid customerId,
        Guid bookingId,
        DateTime scheduledAt,
        CancellationToken cancellationToken = default)
        => CreateAsync(
            customerId,
            "customer",
            "booking",
            "Booking đã được xác nhận",
            $"Photographer đã xác nhận lịch chụp {scheduledAt:dd/MM/yyyy HH:mm}.",
            "open_booking_detail",
            new { bookingId },
            cancellationToken);

    public Task<AppNotification> NotifyBookingCancelledAsync(
        Guid recipientId,
        string recipientRole,
        Guid bookingId,
        string reason,
        CancellationToken cancellationToken = default)
        => CreateAsync(
            recipientId,
            recipientRole,
            "booking",
            "Booking đã bị hủy",
            reason,
            "open_booking_detail",
            new { bookingId },
            cancellationToken);

    public Task<AppNotification> NotifyBookingCompletedAsync(
        Guid customerId,
        Guid bookingId,
        CancellationToken cancellationToken = default)
        => CreateAsync(
            customerId,
            "customer",
            "booking",
            "Buổi chụp đã hoàn tất",
            "Bạn có thể để lại đánh giá cho buổi chụp này.",
            "open_review",
            new { bookingId },
            cancellationToken);

    public Task<AppNotification> NotifyReviewSubmittedAsync(
        Guid photographerId,
        Guid bookingId,
        CancellationToken cancellationToken = default)
        => CreateAsync(
            photographerId,
            "photographer",
            "review",
            "Bạn có đánh giá mới",
            "Customer vừa gửi một đánh giá cho booking này.",
            "open_booking_detail",
            new { bookingId },
            cancellationToken);

    public async Task NotifyMatchCreatedAsync(
        Guid customerId,
        Guid photographerId,
        Guid matchId,
        CancellationToken cancellationToken = default)
    {
        await CreateAsync(
            customerId,
            "customer",
            "match",
            "Bạn đã match!",
            "Hãy bắt đầu trò chuyện với photographer.",
            "open_conversation",
            new { matchId },
            cancellationToken);

        await CreateAsync(
            photographerId,
            "photographer",
            "match",
            "Có một match mới",
            "Bạn và customer đã match. Hãy bắt đầu cuộc trò chuyện.",
            "open_conversation",
            new { matchId },
            cancellationToken);
    }
}
