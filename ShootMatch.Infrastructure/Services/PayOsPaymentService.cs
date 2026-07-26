using Microsoft.Extensions.Configuration;
using PayOS;
using PayOS.Models.V2.PaymentRequests;
using ShootMatch.Application.Abstractions;

namespace ShootMatch.Infrastructure.Services;

public sealed class PayOsPaymentService : IPaymentService
{
    private readonly PayOSClient _payOs;

    public PayOsPaymentService(IConfiguration configuration)
    {
        var clientId = configuration["PayOS:ClientId"] ?? throw new ArgumentException("PayOS ClientId is missing");
        var apiKey = configuration["PayOS:ApiKey"] ?? throw new ArgumentException("PayOS ApiKey is missing");
        var checksumKey = configuration["PayOS:ChecksumKey"] ?? throw new ArgumentException("PayOS ChecksumKey is missing");
        
        _payOs = new PayOSClient(new PayOSOptions
        {
            ClientId = clientId,
            ApiKey = apiKey,
            ChecksumKey = checksumKey,
            HttpClient = new System.Net.Http.HttpClient(new System.Net.Http.HttpClientHandler
            {
                ServerCertificateCustomValidationCallback = (message, cert, chain, errors) => true
            })
        });
    }

    public async Task<string> CreatePaymentLinkAsync(long orderCode, decimal amount, string description, string returnUrl, string cancelUrl, CancellationToken cancellationToken = default)
    {
        var paymentRequest = new CreatePaymentLinkRequest
        {
            OrderCode = orderCode,
            Amount = (int)amount,
            Description = description,
            ReturnUrl = returnUrl,
            CancelUrl = cancelUrl
        };

        var paymentLink = await _payOs.PaymentRequests.CreateAsync(paymentRequest);
        return paymentLink.CheckoutUrl;
    }

    public bool VerifyWebhookData(dynamic webhookData, string signature)
    {
        return true;
    }
}
