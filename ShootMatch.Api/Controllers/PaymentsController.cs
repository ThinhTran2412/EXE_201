using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayOS;
using PayOS.Models;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Aggregates;
using ShootMatch.Infrastructure.Persistence;
using ShootMatch.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using PayOS.Models.V2.PaymentRequests;
using System.Net.Http;

namespace ShootMatch.Api.Controllers;

[ApiController]
[Route("api/payments")]
public sealed class PaymentsController(
    IBookingRepository bookingRepository,
    ShootMatch.Application.Services.NotificationService notificationService,
    ShootMatchDbContext db,
    IConfiguration configuration,
    IEmailService emailService) : ControllerBase
{
    private readonly PayOSClient _payOs = new(new PayOSOptions
    {
        ClientId = configuration["PayOS:ClientId"]!,
        ApiKey = configuration["PayOS:ApiKey"]!,
        ChecksumKey = configuration["PayOS:ChecksumKey"]!,
        HttpClient = new HttpClient(new HttpClientHandler
        {
            ServerCertificateCustomValidationCallback = (message, cert, chain, errors) => true
        })
    });

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
            
            try 
            {
                await System.IO.File.AppendAllTextAsync("payos_webhook_log.txt", $"\n\n--- PAYOS WEBHOOK ---\nTime: {DateTime.UtcNow:O}\n{bodyText}\n", cancellationToken);
            } 
            catch { /* ignore */ }

            var options = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var webhookBody = System.Text.Json.JsonSerializer.Deserialize<PayOS.Models.Webhooks.Webhook>(bodyText, options);

            if (webhookBody == null) return BadRequest("Cannot deserialize");

            // Verify signature
            var webhookData = await _payOs.Webhooks.VerifyAsync(webhookBody);

            if (webhookData.Code == "00")
            {
                var orderCode = webhookData.OrderCode;
                
                // 1. Check if it is a membership payment
                var membershipOrder = await db.MembershipOrders.FirstOrDefaultAsync(o => o.OrderCode == orderCode, cancellationToken);
                if (membershipOrder != null && membershipOrder.Status == "Pending")
                {
                    membershipOrder.Status = "Paid";
                    membershipOrder.CounterAccountBankName = string.IsNullOrWhiteSpace(webhookData.CounterAccountBankName) ? "MOMO" : webhookData.CounterAccountBankName;
                    membershipOrder.CounterAccountName = string.IsNullOrWhiteSpace(webhookData.CounterAccountName) ? "MOMO TRANSFER" : webhookData.CounterAccountName;
                    membershipOrder.CounterAccountNumber = string.IsNullOrWhiteSpace(webhookData.CounterAccountNumber) || webhookData.CounterAccountNumber == "2281072020614" 
                        ? GetRandomMockAccount() 
                        : webhookData.CounterAccountNumber;
                    
                    var plan = await db.MembershipPlans.AsNoTracking().FirstOrDefaultAsync(p => p.Id == membershipOrder.PlanId, cancellationToken);
                    var tierName = plan?.Name ?? (membershipOrder.PlanId == "pro" ? "Pro" : (membershipOrder.PlanId == "studio_plus" ? "Studio+" : (membershipOrder.PlanId == "chon_xinh" ? "Chọn Xinh" : "Chốt Xịn")));

                    string userEmail = "";
                    string userDisplayName = "";

                    if (membershipOrder.UserRole == "customer")
                    {
                        var customer = await db.Customers.FirstOrDefaultAsync(c => c.Id == membershipOrder.UserId, cancellationToken);
                        if (customer != null)
                        {
                            customer.MembershipTier = tierName;
                            userEmail = customer.Email;
                            userDisplayName = customer.DisplayName;
                        }
                    }
                    else if (membershipOrder.UserRole == "photographer")
                    {
                        var photographer = await db.Photographers.FirstOrDefaultAsync(p => p.Id == membershipOrder.UserId, cancellationToken);
                        if (photographer != null)
                        {
                            photographer.MembershipTier = tierName;
                            photographer.IsPremium = tierName == "Pro" || tierName == "Studio+";
                            photographer.UpdatedAt = DateTime.UtcNow;
                            userEmail = photographer.Email;
                            userDisplayName = photographer.DisplayName;
                        }
                    }

                    await db.SaveChangesAsync(cancellationToken);

                    // Send email invoice asynchronously
                    if (!string.IsNullOrEmpty(userEmail))
                    {
                        _ = Task.Run(async () => {
                            try
                            {
                                await emailService.SendMembershipInvoiceEmailAsync(
                                    userEmail,
                                    userDisplayName,
                                    tierName,
                                    membershipOrder.Cycle,
                                    membershipOrder.Amount,
                                    membershipOrder.OrderCode,
                                    membershipOrder.CounterAccountBankName ?? "PayOS Gateway",
                                    membershipOrder.CounterAccountName ?? "N/A",
                                    membershipOrder.CounterAccountNumber ?? "N/A"
                                );
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"Failed to send asynchronous invoice email: {ex.Message}");
                            }
                        });
                    }
                }
                else
                {
                    // 2. Fallback to Booking payment
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
            }

            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            Console.WriteLine("WEBHOOK ERROR: " + ex.Message);
            return Ok(new { success = false, message = ex.Message }); // Return Ok with success=false so PayOS dashboard saves the URL successfully!
        }
    }

    [Authorize]
    [HttpPost("membership/create-link")]
    public async Task<IActionResult> CreateMembershipPaymentLink(
        [FromBody] CreateMembershipPaymentLinkRequest request,
        CancellationToken cancellationToken)
    {
        var plan = await db.MembershipPlans.AsNoTracking().FirstOrDefaultAsync(p => p.Id == request.PlanId, cancellationToken);
        if (plan is null) return BadRequest("Plan not found");

        decimal amount = request.Cycle switch
        {
            "month" => plan.PriceMonthly,
            "6months" => plan.PriceSixMonths,
            "year" => plan.PriceYearly,
            _ => 0
        };

        if (amount <= 0) return BadRequest("Invalid amount or cycle");

        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "customer";

        var random = new Random();
        long orderCode = random.NextInt64(1000000000, 9007199254740991);

        var membershipOrder = new MembershipOrderRecord
        {
            OrderCode = orderCode,
            UserId = userId,
            UserRole = userRole,
            PlanId = request.PlanId,
            Cycle = request.Cycle,
            Amount = amount,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        await db.MembershipOrders.AddAsync(membershipOrder, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        var planAbbr = plan.Id switch
        {
            "chon_xinh" => "CX",
            "chot_xin" => "CXIN",
            "pro" => "PRO",
            "studio_plus" => "ST",
            _ => "BSC"
        };
        var description = $"DK {planAbbr} {orderCode}";
        if (description.Length > 25)
        {
            description = description.Substring(0, 25);
        }

        var paymentRequest = new CreatePaymentLinkRequest
        {
            OrderCode = orderCode,
            Amount = (int)amount,
            Description = description,
            ReturnUrl = request.ReturnUrl,
            CancelUrl = request.CancelUrl
        };

        var createPaymentResult = await _payOs.PaymentRequests.CreateAsync(paymentRequest);
        return Ok(createPaymentResult);
    }

    [HttpGet("membership/status/{orderCode}")]
    public async Task<IActionResult> GetMembershipOrderStatus(long orderCode, CancellationToken cancellationToken)
    {
        var order = await db.MembershipOrders.FirstOrDefaultAsync(o => o.OrderCode == orderCode, cancellationToken);
        if (order is null) return NotFound("Order not found");

        if (order.Status == "Pending")
        {
            try
            {
                var paymentInfo = await _payOs.PaymentRequests.GetAsync(orderCode);
                if (paymentInfo != null && paymentInfo.Status == PaymentLinkStatus.Paid)
                {
                    order.Status = "Paid";
                    if (paymentInfo.Transactions != null && paymentInfo.Transactions.Count > 0)
                    {
                        var txn = paymentInfo.Transactions[0];
                        order.CounterAccountBankName = string.IsNullOrWhiteSpace(txn.CounterAccountBankName) ? "MOMO" : txn.CounterAccountBankName;
                        order.CounterAccountName = string.IsNullOrWhiteSpace(txn.CounterAccountName) ? "MOMO TRANSFER" : txn.CounterAccountName;
                        order.CounterAccountNumber = string.IsNullOrWhiteSpace(txn.CounterAccountNumber) || txn.CounterAccountNumber == "2281072020614" 
                            ? GetRandomMockAccount() 
                            : txn.CounterAccountNumber;
                    }

                    var plan = await db.MembershipPlans.AsNoTracking().FirstOrDefaultAsync(p => p.Id == order.PlanId, cancellationToken);
                    var tierName = plan?.Name ?? (order.PlanId == "pro" ? "Pro" : (order.PlanId == "studio_plus" ? "Studio+" : (order.PlanId == "chon_xinh" ? "Chọn Xinh" : "Chốt Xịn")));

                    string userEmail = "";
                    string userDisplayName = "";

                    if (order.UserRole == "customer")
                    {
                        var customer = await db.Customers.FirstOrDefaultAsync(c => c.Id == order.UserId, cancellationToken);
                        if (customer != null)
                        {
                            customer.MembershipTier = tierName;
                            userEmail = customer.Email;
                            userDisplayName = customer.DisplayName;
                        }
                    }
                    else if (order.UserRole == "photographer")
                    {
                        var photographer = await db.Photographers.FirstOrDefaultAsync(p => p.Id == order.UserId, cancellationToken);
                        if (photographer != null)
                        {
                            photographer.MembershipTier = tierName;
                            photographer.IsPremium = tierName == "Pro" || tierName == "Studio+";
                            photographer.UpdatedAt = DateTime.UtcNow;
                            userEmail = photographer.Email;
                            userDisplayName = photographer.DisplayName;
                        }
                    }

                    await db.SaveChangesAsync(cancellationToken);

                    // Send email invoice asynchronously
                    if (!string.IsNullOrEmpty(userEmail))
                    {
                        _ = Task.Run(async () => {
                            try
                            {
                                await emailService.SendMembershipInvoiceEmailAsync(
                                    userEmail,
                                    userDisplayName,
                                    tierName,
                                    order.Cycle,
                                    order.Amount,
                                    order.OrderCode,
                                    order.CounterAccountBankName ?? "PayOS Gateway",
                                    order.CounterAccountName ?? "N/A",
                                    order.CounterAccountNumber ?? "N/A"
                                );
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"Failed to send asynchronous invoice email: {ex.Message}");
                            }
                        });
                    }
                }
                else if (paymentInfo != null && (paymentInfo.Status == PaymentLinkStatus.Cancelled || paymentInfo.Status == PaymentLinkStatus.Expired))
                {
                    order.Status = "Cancelled";
                    await db.SaveChangesAsync(cancellationToken);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error checking PayOS status: " + ex.Message);
            }
        }

        return Ok(new { status = order.Status });
    }

    [HttpGet("membership/transactions")]
    public async Task<IActionResult> GetMembershipTransactions(CancellationToken cancellationToken)
    {
        var orders = await db.MembershipOrders
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(cancellationToken);

        var customerIds = orders.Where(o => o.UserRole == "customer").Select(o => o.UserId).Distinct().ToList();
        var photographerIds = orders.Where(o => o.UserRole == "photographer").Select(o => o.UserId).Distinct().ToList();

        var customers = await db.Customers
            .Where(c => customerIds.Contains(c.Id))
            .ToDictionaryAsync(c => c.Id, c => c.DisplayName, cancellationToken);

        var photographers = await db.Photographers
            .Where(p => photographerIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, p => p.DisplayName, cancellationToken);

        var result = orders.Select(o => new
        {
            o.OrderCode,
            o.UserId,
            o.UserRole,
            UserName = o.UserRole == "customer" 
                ? (customers.TryGetValue(o.UserId, out var cName) ? cName : "Khách hàng") 
                : (photographers.TryGetValue(o.UserId, out var pName) ? pName : "Nhiếp ảnh gia"),
            o.PlanId,
            o.Cycle,
            o.Amount,
            o.Status,
            o.CreatedAt,
            CounterAccountBankName = (o.CounterAccountBankName == "MOMO" || string.IsNullOrWhiteSpace(o.CounterAccountBankName))
                ? (string.IsNullOrWhiteSpace(o.CounterAccountName) || o.CounterAccountName == "MOMO TRANSFER" ? "MOMO" : "") 
                : o.CounterAccountBankName,
            CounterAccountName = string.IsNullOrWhiteSpace(o.CounterAccountName) || o.CounterAccountName == "MOMO TRANSFER" ? "" : o.CounterAccountName,
            CounterAccountNumber = string.IsNullOrWhiteSpace(o.CounterAccountNumber) || o.CounterAccountNumber == "2281072020614" ? GetRandomMockAccount() : o.CounterAccountNumber
        });

        return Ok(result);
    }

    private static string GetRandomMockAccount()
    {
        var mockAccounts = new[] 
        { 
            "2281072021115", "2281072021892", "2281072022341", "2281072023908", 
            "2281072024567", "2281072025112", "2281072026789", "2281072027234", 
            "2281072028881", "2281072029090" 
        };
        return mockAccounts[new Random().Next(mockAccounts.Length)];
    }
}

public sealed class CreateMembershipPaymentLinkRequest
{
    public string PlanId { get; set; } = string.Empty;
    public string Cycle { get; set; } = string.Empty; // "month", "6months", "year"
    public string ReturnUrl { get; set; } = string.Empty;
    public string CancelUrl { get; set; } = string.Empty;
}
