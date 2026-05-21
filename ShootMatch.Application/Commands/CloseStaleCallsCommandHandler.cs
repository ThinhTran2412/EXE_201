using ShootMatch.Application.Abstractions;

namespace ShootMatch.Application.Commands;

public sealed class CloseStaleCallsCommandHandler(ICallSessionRepository callSessionRepository)
{
    public async Task<int> CloseExpiredRingingCallsAsync(TimeSpan ringTimeout, CancellationToken cancellationToken = default)
    {
        _ = callSessionRepository;
        await Task.CompletedTask;
        return 0;
    }
}
