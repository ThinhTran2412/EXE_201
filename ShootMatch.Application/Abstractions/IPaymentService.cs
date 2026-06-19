namespace ShootMatch.Application.Abstractions;

public interface IPaymentService
{
    Task<string> CreatePaymentLinkAsync(long orderCode, decimal amount, string description, string returnUrl, string cancelUrl, CancellationToken cancellationToken = default);
    bool VerifyWebhookData(dynamic webhookData, string signature);
}
