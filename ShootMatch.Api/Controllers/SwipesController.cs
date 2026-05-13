using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShootMatch.Api.Contracts;
using ShootMatch.Application.Commands;
using System.Security.Claims;

namespace ShootMatch.Api.Controllers;

/// <summary>
/// Records swipe actions (Left/Right) on photographers from a search session.
/// A Right swipe triggers the mutual-match detection flow.
/// 
/// POST /api/matching/swipes
/// </summary>
[ApiController]
[Route("api/matching")]
[Authorize]
public sealed class SwipesController(RecordSwipeCommandHandler commandHandler) : ControllerBase
{
    /// <summary>
    /// Records a swipe (Left or Right) on a photographer from a search session.
    /// If both parties swipe Right, a Match is automatically created.
    /// </summary>
    /// <param name="request">SearchSessionId, PhotographerId, Direction ("Left" | "Right")</param>
    [HttpPost("swipes")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RecordSwipe(
        [FromBody] RecordSwipeRequest request,
        CancellationToken cancellationToken)
    {
        if (request.Direction is not ("Left" or "Right"))
            return BadRequest("Direction must be 'Left' or 'Right'.");

        await commandHandler.HandleAsync(new RecordSwipeCommand(
            CustomerId:      GetCustomerIdOrThrow(User),
            SearchSessionId: request.SearchSessionId,
            PhotographerId:  request.PhotographerId,
            Direction:       request.Direction),
            cancellationToken);

        return Accepted();
    }

    private static Guid GetCustomerIdOrThrow(ClaimsPrincipal user)
    {
        var claim = user.FindFirst("customer_id")?.Value;
        if (!Guid.TryParse(claim, out var id))
            throw new UnauthorizedAccessException("Missing customer_id claim.");
        return id;
    }
}
