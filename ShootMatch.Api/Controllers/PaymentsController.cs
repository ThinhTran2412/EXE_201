using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayOS;
using PayOS.Models;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Aggregates;

namespace ShootMatch.Api.Controllers;

[ApiController]
[Route("api/payments")]
public sealed class PaymentsController(
    IBookingRepository bookingRepository,
    ShootMatch.Application.Services.NotificationService notificationService,
    IConfiguration configuration) : ControllerBase
{
    private readonly PayOSClient _payOs = new(
        configuration["PayOS:ClientId"]!,
        configuration["PayOS:ApiKey"]!,
        configuration["PayOS:ChecksumKey"]!);

    [HttpPost("payos-webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> PayOsWebhook(CancellationToken cancellationToken)
    {
        try
        {
            using var reader = new StreamReader(Request.Body);
            var bodyText = await reader.ReadToEndAsync(cancellationToken);
            Console.WriteLine("--- PAYOS WEBHOOK RECEIVED ---");
            Console.WriteLine(bodyText);

            var options = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var webhookBody = System.Text.Json.JsonSerializer.Deserialize<PayOS.Models.Webhooks.Webhook>(bodyText, options);

            if (webhookBody == null) return BadRequest("Cannot deserialize");

            // Verify signature
            var webhookData = await _payOs.Webhooks.VerifyAsync(webhookBody);

            if (webhookData.Code == "00")
            {
                // Payment success
                var orderCode = webhookData.OrderCode;
                
                var allBookings = await bookingRepository.GetAllAsync(cancellationToken);
                var booking = allBookings.FirstOrDefault(b => b.PayOsOrderCode == orderCode);
                
                if (booking != null && booking.Status == BookingStatus.AwaitingDeposit)
                {
                    booking.MarkDepositPaid();
                    await bookingRepository.SaveAsync(booking, cancellationToken);
                    
                    // Notify Customer (so their UI updates)
                    await notificationService.NotifyDepositPaidToCustomerAsync(
                        booking.CustomerId,
                        booking.Id,
                        booking.ScheduledAt,
                        cancellationToken);

                    // Notify Photographer
                    await notificationService.NotifyDepositPaidToPhotographerAsync(
                        booking.PhotographerId,
                        booking.Id,
                        booking.ScheduledAt,
                        cancellationToken);
                }
            }

            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            Console.WriteLine("WEBHOOK ERROR: " + ex.Message);
            return Ok(new { success = false, message = ex.Message }); // Return Ok with success=false so PayOS dashboard saves the URL successfully!
        }
    }
}
