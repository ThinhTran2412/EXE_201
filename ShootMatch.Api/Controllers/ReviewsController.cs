using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShootMatch.Api.Contracts;
using ShootMatch.Application.Commands;
using ShootMatch.Domain.Exceptions;
using System.Security.Claims;

namespace ShootMatch.Api.Controllers;

/// <summary>
/// Manages Reviews — can only be submitted after a Booking is Completed.
/// Invariant is enforced in domain via BookingAggregate.EnsureCanBeReviewed().
///
/// POST /api/reviews
/// </summary>
[ApiController]
[Route("api/reviews")]
[Authorize]
public sealed class ReviewsController(SubmitReviewCommandHandler commandHandler) : ControllerBase
{
    /// <summary>
    /// Submits a review for a completed booking (1-5 stars).
    /// Returns 400 if booking is not Completed or review already exists.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SubmitReview(
        [FromBody] SubmitReviewRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var reviewId = await commandHandler.HandleAsync(new SubmitReviewCommand(
                CustomerId: GetCustomerIdOrThrow(User),
                BookingId:  request.BookingId,
                Rating:     request.Rating,
                Comment:    request.Comment),
                cancellationToken);

            return CreatedAtAction(nameof(SubmitReview), new { id = reviewId }, new { reviewId });
        }
        catch (DomainException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    private static Guid GetCustomerIdOrThrow(ClaimsPrincipal user)
    {
        var claim = user.FindFirst("customer_id")?.Value;
        if (!Guid.TryParse(claim, out var id))
            throw new UnauthorizedAccessException("Missing customer_id claim.");
        return id;
    }
}
