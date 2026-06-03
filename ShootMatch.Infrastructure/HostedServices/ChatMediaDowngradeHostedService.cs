using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;

namespace ShootMatch.Infrastructure.HostedServices;

/// <summary>Sau 3 ngày: xóa ảnh gốc, chỉ giữ bản preview trong DB.</summary>
public sealed class ChatMediaDowngradeHostedService(
    IServiceProvider services,
    ILogger<ChatMediaDowngradeHostedService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunOnceAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Chat media downgrade cycle failed.");
            }

            await Task.Delay(Interval, stoppingToken);
        }
    }

    private async Task RunOnceAsync(CancellationToken cancellationToken)
    {
        using var scope = services.CreateScope();
        var conversations = scope.ServiceProvider.GetRequiredService<IConversationRepository>();
        var images = scope.ServiceProvider.GetRequiredService<IChatImageService>();
        var now = DateTime.UtcNow;
        var batch = await conversations.GetExpiredImageMessagesAsync(now, limit: 50, cancellationToken);

        foreach (var msg in batch)
        {
            if (string.IsNullOrWhiteSpace(msg.MediaPreviewUrl)) continue;

            await images.DowngradeMessageAsync(msg.Id, msg.Content, msg.MediaPreviewUrl, cancellationToken);

            var updated = new Message
            {
                Id = msg.Id,
                ConversationId = msg.ConversationId,
                SenderId = msg.SenderId,
                SenderRole = msg.SenderRole,
                Content = msg.MediaPreviewUrl,
                ContentType = msg.ContentType,
                MediaPreviewUrl = msg.MediaPreviewUrl,
                MediaExpiresAt = msg.MediaExpiresAt,
                MediaDowngraded = true,
                SentAt = msg.SentAt,
                ReadAt = msg.ReadAt,
            };
            await conversations.UpdateMessageMediaAsync(updated, cancellationToken);
        }

        if (batch.Count > 0)
            logger.LogInformation("Downgraded {Count} chat image(s).", batch.Count);
    }
}
