using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShootMatch.Api.Contracts;
using ShootMatch.Application.Commands;
using ShootMatch.Application.Contracts;
using System.Security.Claims;

namespace ShootMatch.Api.Controllers;

[ApiController]
[Route("api/matching")]
public sealed class MatchingController(CreateMatchSearchCommandHandler commandHandler) : ControllerBase
{
    [Authorize]
    [HttpPost("searches")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<MatchSearchResult>> CreateSearch(
        [FromBody] CreateMatchSearchRequest request,
        CancellationToken cancellationToken)
    {
        if (request.ReferenceImageUrls.Count is < 3 or > 5)
        {
            return BadRequest("Please upload 3-5 reference images.");
        }

        var result = await commandHandler.HandleAsync(new CreateMatchSearchCommand
        {
            CustomerId = GetCustomerIdOrThrow(User),
            ReferenceImageUrls = request.ReferenceImageUrls,
            Region = request.Region,
            Budget = request.Budget,
            TopK = request.TopK
        }, cancellationToken);

        return CreatedAtAction(nameof(CreateSearch), new { searchId = result.SearchId }, result);
    }

    private static Guid GetCustomerIdOrThrow(ClaimsPrincipal user)
    {
        var claim = user.FindFirst("customer_id")?.Value;
        if (!Guid.TryParse(claim, out var customerId))
        {
            throw new UnauthorizedAccessException("Missing customer_id claim.");
        }

        return customerId;
    }
}
