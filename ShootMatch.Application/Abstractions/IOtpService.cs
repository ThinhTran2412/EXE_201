namespace ShootMatch.Application.Abstractions;

public interface IOtpService
{
    Task SendAsync(string phone, CancellationToken cancellationToken);
    Task<bool> VerifyAsync(string phone, string otpCode, CancellationToken cancellationToken);
}
