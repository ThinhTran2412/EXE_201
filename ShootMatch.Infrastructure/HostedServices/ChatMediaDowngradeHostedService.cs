using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ShootMatch.Infrastructure.HostedServices;

/// <summary>Periodic background worker reserved for future chat maintenance.</summary>
public sealed class ChatMediaDowngradeHostedService(ILogger<ChatMediaDowngradeHostedService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                logger.LogDebug("Chat media maintenance tick.");
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Chat media maintenance cycle failed.");
            }

            await Task.Delay(Interval, stoppingToken);
        }
    }
}
