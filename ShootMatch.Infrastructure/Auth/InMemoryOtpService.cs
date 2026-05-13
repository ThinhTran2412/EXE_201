using ShootMatch.Application.Abstractions;
using System.Collections.Concurrent;

namespace ShootMatch.Infrastructure.Auth;

public sealed class InMemoryOtpService : IOtpService
{
    private readonly ConcurrentDictionary<string, string> _otpCache = new();

    public Task SendAsync(string phone, CancellationToken cancellationToken)
    {
        // TODO: Replace with Twilio/Stringee provider adapter.
        _otpCache[phone] = "123456";
        return Task.CompletedTask;
    }

    public Task<bool> VerifyAsync(string phone, string otpCode, CancellationToken cancellationToken)
    {
        var isValid = _otpCache.TryGetValue(phone, out var cached) && cached == otpCode;
        if (isValid)
        {
            _otpCache.TryRemove(phone, out _);
        }

        return Task.FromResult(isValid);
    }
}
