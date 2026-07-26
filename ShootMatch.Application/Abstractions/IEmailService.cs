using System.Threading;
using System.Threading.Tasks;

namespace ShootMatch.Application.Abstractions;

public interface IEmailService
{
    Task SendOtpEmailAsync(string toEmail, string otp, CancellationToken cancellationToken = default);
    
    Task SendMembershipInvoiceEmailAsync(
        string toEmail, 
        string userName, 
        string planName, 
        string cycle, 
        decimal amount, 
        long orderCode, 
        string bankName, 
        string accountName, 
        string accountNumber, 
        CancellationToken cancellationToken = default);
}
