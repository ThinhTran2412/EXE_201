using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShootMatch.Api.Contracts;
using ShootMatch.Application.Abstractions;
using ShootMatch.Application.Commands;
using ShootMatch.Domain.Exceptions;
using ShootMatch.Domain.Aggregates;
using System.Security.Claims;

namespace ShootMatch.Api.Controllers;

/// <summary>
/// Booking lifecycle management.
///
/// POST   /api/bookings               — Customer creates booking from Active match
/// POST   /api/bookings/{id}/confirm  — Photographer confirms booking (Pending → Confirmed)
/// POST   /api/bookings/{id}/complete — Photographer marks shoot done (Confirmed → Completed)
/// POST   /api/bookings/{id}/cancel   — Customer OR Photographer cancels (→ Cancelled)
/// </summary>
[ApiController]
[Route("api/bookings")]
[Authorize]
public sealed class BookingsController(
    CreateBookingCommandHandler createHandler,
    IBookingRepository bookingRepository,
    ShootMatch.Application.Services.NotificationService notificationService) : ControllerBase
{
    private const decimal DefaultCommissionRate = 0.10m;

    // ── Customer: Create ──────────────────────────────────────────────────────

    /// <summary>
    /// Creates a booking from an Active match.
    /// Requires role = "customer". Match must be Active.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "customer")]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateBooking(
        [FromBody] CreateBookingRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var bookingId = await createHandler.HandleAsync(new CreateBookingCommand(
                CustomerId:       GetUserId(User, "customer_id"),
                MatchId:          request.MatchId,
                ServicePackageId: request.ServicePackageId,
                AgreedPrice:      request.AgreedPrice,
                Commission:       request.Commission,
                ScheduledAt:      request.ScheduledAt,
                Phone:            request.Phone,
                Location:         request.Location,
                Note:             request.Note,
                Requirements:     request.Requirements),
                cancellationToken);

            return CreatedAtAction(nameof(CreateBooking), new { id = bookingId }, new { bookingId });
        }
        catch (DomainException ex) { return BadRequest(ex.Message); }
    }

    // ── Customer: Create Payment Link ──────────────────────────────────────────

    /// <summary>
    /// Creates a PayOS checkout link for a booking awaiting deposit.
    /// </summary>
    [HttpPost("{id:guid}/create-payment-link")]
    [Authorize(Roles = "customer")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreatePaymentLink(
        Guid id, 
        [FromServices] IPaymentService paymentService,
        [FromServices] IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        try
        {
            var booking = await bookingRepository.GetByIdAsync(id, cancellationToken);
            if (booking is null) return NotFound();

            var customerId = GetUserId(User, "customer_id");
            if (booking.CustomerId != customerId)
                return Forbid();

            if (booking.Status != BookingStatus.AwaitingDeposit)
                return BadRequest("Booking is not awaiting deposit.");

            // Generate unique order code (must be long for PayOS and < 9007199254740991)
            var orderCode = long.Parse(DateTimeOffset.Now.ToString("yyMMddHHmmss") + new Random().Next(100, 999).ToString());
            
            booking.AssignPayOsOrderCode(orderCode);
            await bookingRepository.SaveAsync(booking, cancellationToken);

            var returnUrl = configuration["PayOS:ReturnUrl"] ?? "exp://127.0.0.1:8081/--/payment-result";
            var cancelUrl = configuration["PayOS:CancelUrl"] ?? "exp://127.0.0.1:8081/--/payment-result";
            
            var description = $"Coc {orderCode}";
            
            var checkoutUrl = await paymentService.CreatePaymentLinkAsync(
                orderCode,
                booking.DepositAmount,
                description,
                returnUrl,
                cancelUrl,
                cancellationToken);

            return Ok(new { checkoutUrl });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    // ── Photographer: Confirm ─────────────────────────────────────────────────

    /// <summary>
    /// Photographer confirms a Pending booking (Pending → Confirmed).
    /// Raises BookingConfirmed domain event.
    /// </summary>
    [HttpPost("{id:guid}/confirm")]
    [Authorize(Roles = "photographer")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ConfirmBooking(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var booking = await bookingRepository.GetByIdAsync(id, cancellationToken);
            if (booking is null) return NotFound();

            var photographerId = GetUserId(User, "photographer_id");
            if (booking.PhotographerId != photographerId)
                return Forbid();

            booking.Confirm();
            await bookingRepository.SaveAsync(booking, cancellationToken);
            await notificationService.NotifyBookingConfirmedAsync(
                booking.CustomerId,
                booking.Id,
                booking.ScheduledAt,
                cancellationToken);
            return NoContent();
        }
        catch (DomainException ex) { return BadRequest(ex.Message); }
    }

    // ── Photographer: Complete ────────────────────────────────────────────────

    /// <summary>
    /// Photographer marks a Confirmed booking as Completed.
    /// Triggers escrow release flow (BookingCompleted event).
    /// </summary>
    [HttpPost("{id:guid}/complete")]
    [Authorize(Roles = "photographer")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CompleteBooking(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var booking = await bookingRepository.GetByIdAsync(id, cancellationToken);
            if (booking is null) return NotFound();

            var photographerId = GetUserId(User, "photographer_id");
            if (booking.PhotographerId != photographerId)
                return Forbid();

            booking.Complete();
            await bookingRepository.SaveAsync(booking, cancellationToken);
            await notificationService.NotifyBookingCompletedAsync(
                booking.CustomerId,
                booking.Id,
                cancellationToken);
            return NoContent();
        }
        catch (DomainException ex) { return BadRequest(ex.Message); }
    }

    // ── Customer or Photographer: Cancel ─────────────────────────────────────

    /// <summary>
    /// Cancels a booking. Both Customer and Photographer may cancel.
    /// Requires a cancellation reason.
    /// </summary>
    [HttpPost("{id:guid}/cancel")]
    [Authorize(Roles = "customer,photographer")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CancelBooking(
        Guid id,
        [FromBody] CancelBookingRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var booking = await bookingRepository.GetByIdAsync(id, cancellationToken);
            if (booking is null) return NotFound();

            // Determine caller's id regardless of role
            var callerIdStr = User.FindFirst("customer_id")?.Value
                           ?? User.FindFirst("photographer_id")?.Value;
            if (!Guid.TryParse(callerIdStr, out var callerId))
                return Forbid();

            if (booking.CustomerId != callerId && booking.PhotographerId != callerId)
                return Forbid();

            booking.Cancel(callerId, request.Reason);
            await bookingRepository.SaveAsync(booking, cancellationToken);

            var recipientIsCustomer = callerId == booking.PhotographerId;
            await notificationService.NotifyBookingCancelledAsync(
                recipientIsCustomer ? booking.CustomerId : booking.PhotographerId,
                recipientIsCustomer ? "customer" : "photographer",
                booking.Id,
                request.Reason,
                cancellationToken);
            return NoContent();
        }
        catch (DomainException ex) { return BadRequest(ex.Message); }
    }

    // ── Session Status Management ─────────────────────────────────────────────

    /// <summary>
    /// Update live shooting session status.
    /// Can transition to: Moving, Arrived, InProgress.
    /// </summary>
    [HttpPut("{id:guid}/session-status")]
    [Authorize(Roles = "customer,photographer")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateSessionStatus(
        Guid id,
        [FromBody] UpdateSessionStatusRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var booking = await bookingRepository.GetByIdAsync(id, cancellationToken);
            if (booking is null) return NotFound();

            // Determine caller's id regardless of role
            var callerIdStr = User.FindFirst("customer_id")?.Value
                           ?? User.FindFirst("photographer_id")?.Value;
            if (!Guid.TryParse(callerIdStr, out var callerId))
                return Forbid();

            if (booking.CustomerId != callerId && booking.PhotographerId != callerId)
                return Forbid();

            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            switch (request.Status)
            {
                case "Moving":
                    if (role != "photographer")
                        return BadRequest("Only photographer can mark booking as Moving.");
                    booking.StartMoving();
                    break;
                case "Arrived":
                    booking.Arrive();
                    break;
                case "InProgress":
                    if (role != "photographer")
                        return BadRequest("Only photographer can mark booking as InProgress.");
                    booking.StartShooting();
                    break;
                default:
                    return BadRequest($"Unsupported status transition: {request.Status}");
            }

            await bookingRepository.SaveAsync(booking, cancellationToken);

            var recipientId = role == "customer" ? booking.PhotographerId : booking.CustomerId;
            var recipientRole = role == "customer" ? "photographer" : "customer";

            await notificationService.NotifyBookingSessionStatusChangedAsync(
                recipientId,
                recipientRole,
                booking.Id,
                request.Status,
                cancellationToken);

            return NoContent();
        }
        catch (DomainException ex) { return BadRequest(ex.Message); }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static Guid GetUserId(ClaimsPrincipal user, string claimType)
    {
        var claim = user.FindFirst(claimType)?.Value;
        if (!Guid.TryParse(claim, out var id))
            throw new UnauthorizedAccessException($"Missing {claimType} claim.");
        return id;
    }
}
