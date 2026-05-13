using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShootMatch.Api.Contracts;
using ShootMatch.Application.Contracts;
using ShootMatch.Application.Services;
using System.Security.Claims;

namespace ShootMatch.Api.Controllers;

[ApiController]
[Route("api/customers")]
public sealed class CustomersController(CustomerService customerService) : ControllerBase
{
    [Authorize]
    [HttpPost("profile")]
    public async Task<ActionResult<CustomerProfile>> UpsertProfile(
        [FromBody] UpsertCustomerProfileRequest request,
        CancellationToken cancellationToken)
    {
        var customerId = GetCustomerIdOrThrow(User);
        var existing = await customerService.GetProfileAsync(customerId, cancellationToken);

        var profile = await customerService.UpsertProfileAsync(new CustomerProfile
        {
            Id = customerId,
            DisplayName = string.IsNullOrWhiteSpace(request.DisplayName) ? existing?.DisplayName ?? string.Empty : request.DisplayName,
            Phone = string.IsNullOrWhiteSpace(request.Phone) ? existing?.Phone ?? string.Empty : request.Phone,
            Email = string.IsNullOrWhiteSpace(request.Email) ? existing?.Email ?? string.Empty : request.Email,
            Region = string.IsNullOrWhiteSpace(request.Region) ? existing?.Region ?? string.Empty : request.Region,
            AvatarUrl = string.IsNullOrWhiteSpace(request.AvatarUrl) ? existing?.AvatarUrl ?? string.Empty : request.AvatarUrl,
            IsVerified = existing?.IsVerified ?? true,
            CreatedAt = existing?.CreatedAt ?? DateTime.UtcNow
        }, cancellationToken);

        return Ok(profile);
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
