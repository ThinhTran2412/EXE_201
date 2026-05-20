using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShootMatch.Api.Contracts;
using ShootMatch.Application.Abstractions;
using ShootMatch.Application.Contracts;
using ShootMatch.Application.Services;
using System.Security.Claims;

namespace ShootMatch.Api.Controllers;

[ApiController]
[Route("api/customers")]
public sealed class CustomersController(
    CustomerService customerService,
    IStorageService storageService) : ControllerBase
{
    [Authorize(Roles = "customer")]
    [HttpGet("me")]
    [ProducesResponseType(typeof(CustomerProfile), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CustomerProfile>> GetMyProfile(CancellationToken cancellationToken)
    {
        var customerId = GetCustomerIdOrThrow(User);
        var profile = await customerService.GetProfileAsync(customerId, cancellationToken);
        return profile is null ? NotFound() : Ok(profile);
    }

    [Authorize(Roles = "customer")]
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
            CoverPhotoUrl = string.IsNullOrWhiteSpace(request.CoverPhotoUrl) ? existing?.CoverPhotoUrl ?? string.Empty : request.CoverPhotoUrl,
            HighlightPhoto1Url = string.IsNullOrWhiteSpace(request.HighlightPhoto1Url) ? existing?.HighlightPhoto1Url ?? string.Empty : request.HighlightPhoto1Url,
            HighlightPhoto2Url = string.IsNullOrWhiteSpace(request.HighlightPhoto2Url) ? existing?.HighlightPhoto2Url ?? string.Empty : request.HighlightPhoto2Url,
            HighlightPhoto3Url = string.IsNullOrWhiteSpace(request.HighlightPhoto3Url) ? existing?.HighlightPhoto3Url ?? string.Empty : request.HighlightPhoto3Url,
            RollPreviewPhotos = string.IsNullOrWhiteSpace(request.RollPreviewPhotos) ? existing?.RollPreviewPhotos ?? string.Empty : request.RollPreviewPhotos,
            PreferredStyles = string.IsNullOrWhiteSpace(request.PreferredStyles) ? existing?.PreferredStyles ?? string.Empty : request.PreferredStyles,
            IsVerified = existing?.IsVerified ?? true,
            CreatedAt = existing?.CreatedAt ?? DateTime.UtcNow
        }, cancellationToken);

        return Ok(profile);
    }

    [Authorize(Roles = "customer")]
    [HttpPost("profile/avatar/upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadAvatar([FromForm] UploadCustomerPhotoRequest request, CancellationToken ct)
    {
        return await UploadProfilePhoto(request.File, "avatar", ct);
    }

    [Authorize(Roles = "customer")]
    [HttpPost("profile/cover/upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadCover([FromForm] UploadCustomerPhotoRequest request, CancellationToken ct)
    {
        return await UploadProfilePhoto(request.File, "cover", ct);
    }

    [Authorize(Roles = "customer")]
    [HttpPost("profile/highlight-1/upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadHighlight1([FromForm] UploadCustomerPhotoRequest request, CancellationToken ct)
    {
        return await UploadProfilePhoto(request.File, "highlight-1", ct);
    }

    [Authorize(Roles = "customer")]
    [HttpPost("profile/highlight-2/upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadHighlight2([FromForm] UploadCustomerPhotoRequest request, CancellationToken ct)
    {
        return await UploadProfilePhoto(request.File, "highlight-2", ct);
    }

    [Authorize(Roles = "customer")]
    [HttpPost("profile/highlight-3/upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadHighlight3([FromForm] UploadCustomerPhotoRequest request, CancellationToken ct)
    {
        return await UploadProfilePhoto(request.File, "highlight-3", ct);
    }

    [Authorize(Roles = "customer")]
    [HttpPost("profile/roll-preview/upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadRollPreviewPhoto([FromForm] UploadCustomerPhotoRequest request, CancellationToken ct)
    {
        return await UploadProfilePhoto(request.File, "roll-preview", ct);
    }

    private async Task<IActionResult> UploadProfilePhoto(IFormFile file, string kind, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });

        var contentType = file.ContentType?.ToLowerInvariant() ?? string.Empty;
        if (contentType is not ("image/jpeg" or "image/png" or "image/webp" or "image/heic"))
            return BadRequest(new { error = "Only JPEG, PNG, WebP or HEIC files are allowed." });

        var fileName = file.FileName ?? string.Empty;
        var dot = fileName.LastIndexOf('.');
        var ext = dot >= 0 ? fileName[dot..].ToLowerInvariant() : ".jpg";

        var customerId = GetCustomerIdOrThrow(User);
        var safeName = $"customers/{kind}/{customerId}/{Guid.NewGuid():N}{ext.ToLowerInvariant()}";
        var uploadContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "image/jpeg" : file.ContentType;

        await using var stream = file.OpenReadStream();
        var photoUrl = await storageService.UploadAsync(stream, safeName, uploadContentType, ct);
        return Ok(new { photoUrl });
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
