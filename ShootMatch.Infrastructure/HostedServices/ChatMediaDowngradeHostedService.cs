using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ShootMatch.Infrastructure.HostedServices;

public sealed class ChatMediaDowngradeHostedService(ILogger<ChatMediaDowngradeHostedService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            logger.LogInformation("Chat media downgrade service is idle because media preview persistence is not wired yet.");
            await Task.Delay(Interval, stoppingToken);
        }
    }
}
