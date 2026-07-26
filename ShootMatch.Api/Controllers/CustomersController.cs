using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShootMatch.Api.Contracts;
using ShootMatch.Application.Abstractions;
using ShootMatch.Application.Contracts;
using ShootMatch.Application.Services;
using System.Security.Claims;
using ShootMatch.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using ShootMatch.Infrastructure.Persistence;
using ShootMatch.Infrastructure.Persistence.Entities;

namespace ShootMatch.Api.Controllers;

[ApiController]
[Route("api/customers")]
public sealed class CustomersController(
    CustomerService customerService,
    ICustomerRepository customerRepository,
    ShootMatchDbContext db,
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

    [HttpGet("/api/membership/plans")]
    public async Task<IActionResult> GetMembershipPlans(CancellationToken cancellationToken)
    {
        var plans = await db.MembershipPlans.AsNoTracking().ToListAsync(cancellationToken);
        return Ok(plans);
    }

    [Authorize(Roles = "customer")]
    [HttpPost("membership")]
    public async Task<IActionResult> UpdateMembership([FromBody] UpdateMembershipRequest request, CancellationToken cancellationToken)
    {
        var customerId = GetCustomerIdOrThrow(User);
        var customer = await customerRepository.GetByIdAsync(customerId, cancellationToken);
        if (customer is null) return NotFound();

        var updated = new Customer
        {
            Id = customer.Id,
            DisplayName = customer.DisplayName,
            Phone = customer.Phone,
            Email = customer.Email,
            Region = customer.Region,
            AvatarUrl = customer.AvatarUrl,
            CoverPhotoUrl = customer.CoverPhotoUrl,
            HighlightPhoto1Url = customer.HighlightPhoto1Url,
            HighlightPhoto2Url = customer.HighlightPhoto2Url,
            HighlightPhoto3Url = customer.HighlightPhoto3Url,
            RollPreviewPhotos = customer.RollPreviewPhotos,
            PreferredStyles = customer.PreferredStyles,
            IsVerified = customer.IsVerified,
            IsActive = customer.IsActive,
            PasswordHash = customer.PasswordHash,
            GoogleId = customer.GoogleId,
            PreferredBudgetMin = customer.PreferredBudgetMin,
            PreferredBudgetMax = customer.PreferredBudgetMax,
            CreatedAt = customer.CreatedAt,
            LastSeenAt = customer.LastSeenAt,
            DeletedAt = customer.DeletedAt,
            MembershipTier = request.MembershipTier
        };

        await customerRepository.UpsertAsync(updated, cancellationToken);
        return Ok(new { membershipTier = updated.MembershipTier });
    }

    [Authorize(Roles = "customer")]
    [HttpPost("profile")]
    public async Task<ActionResult<CustomerProfile>> UpsertProfile(
        [FromBody] UpsertCustomerProfileRequest request,
        CancellationToken cancellationToken)
    {
        var customerId = GetCustomerIdOrThrow(User);
        var existing = await customerService.GetProfileAsync(customerId, cancellationToken);

        var preferredStylesRaw = string.IsNullOrWhiteSpace(request.PreferredStyles) 
            ? existing?.PreferredStyles ?? string.Empty 
            : request.PreferredStyles;

        var preferredStylesClean = await ParsePreferredStylesAsync(preferredStylesRaw, cancellationToken);

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
            PreferredStyles = preferredStylesClean,
            IsVerified = existing?.IsVerified ?? true,
            CreatedAt = existing?.CreatedAt ?? DateTime.UtcNow,
            MembershipTier = existing?.MembershipTier ?? "Lướt Nhẹ"
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

    private static readonly Dictionary<string, string> LocationMapping = new()
    {
        { "cafe", "Quán Cafe" },
        { "studio", "Studio" },
        { "home", "Tại nhà" },
        { "museum", "Bảo tàng" },
        { "park", "Công viên" },
        { "urban", "Đường phố/Urban" },
        { "beach", "Bãi biển" },
        { "rooftop", "Sân thượng" },
        { "landmark", "Landmark/Cầu" },
        { "historical", "Di tích/Phố cổ" },
        { "abandoned", "Nhà hoang" },
        { "westlake", "Hồ Tây/Sunset" }
    };

    private static readonly Dictionary<string, string> ColorMapping = new()
    {
        { "warm", "Tone Ấm" },
        { "cool", "Tone Lạnh" },
        { "bright", "Pastel Tone" },
        { "mono", "Đen Trắng" },
        { "earthy", "Tone Đất" },
        { "cyber", "Neon Cyber" }
    };

    private async Task<string> ParsePreferredStylesAsync(string preferredStyles, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(preferredStyles))
            return string.Empty;

        preferredStyles = preferredStyles.Trim();
        if (!preferredStyles.StartsWith('{') || !preferredStyles.EndsWith('}'))
        {
            return preferredStyles;
        }

        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(preferredStyles);
            var root = doc.RootElement;
            var tags = new List<string>();

            // 1. Locations
            if (root.TryGetProperty("locations", out var locationsProp) && locationsProp.ValueKind == System.Text.Json.JsonValueKind.Array)
            {
                foreach (var loc in locationsProp.EnumerateArray())
                {
                    var locStr = loc.GetString();
                    if (!string.IsNullOrEmpty(locStr))
                    {
                        tags.Add(LocationMapping.TryGetValue(locStr.ToLowerInvariant(), out var mapped) ? mapped : locStr);
                    }
                }
            }

            // 2. Colors
            if (root.TryGetProperty("colors", out var colorsProp) && colorsProp.ValueKind == System.Text.Json.JsonValueKind.Array)
            {
                foreach (var col in colorsProp.EnumerateArray())
                {
                    var colStr = col.GetString();
                    if (!string.IsNullOrEmpty(colStr))
                    {
                        tags.Add(ColorMapping.TryGetValue(colStr.ToLowerInvariant(), out var mapped) ? mapped : colStr);
                    }
                }
            }

            // 3. Fashion
            if (root.TryGetProperty("fashion", out var fashionProp) && fashionProp.ValueKind == System.Text.Json.JsonValueKind.Array)
            {
                var styleIds = new List<Guid>();
                foreach (var fash in fashionProp.EnumerateArray())
                {
                    var fashStr = fash.GetString();
                    if (Guid.TryParse(fashStr, out var styleId))
                    {
                        styleIds.Add(styleId);
                    }
                    else if (!string.IsNullOrEmpty(fashStr))
                    {
                        tags.Add(fashStr);
                    }
                }

                if (styleIds.Count > 0)
                {
                    var styleNames = await db.Styles
                        .Where(s => styleIds.Contains(s.Id))
                        .Select(s => s.Name)
                        .ToListAsync(cancellationToken);
                    tags.AddRange(styleNames);
                }
            }

            // 4. Concepts
            if (root.TryGetProperty("concepts", out var conceptsProp) && conceptsProp.ValueKind == System.Text.Json.JsonValueKind.Array)
            {
                var conceptIds = new List<Guid>();
                foreach (var con in conceptsProp.EnumerateArray())
                {
                    var conStr = con.GetString();
                    if (Guid.TryParse(conStr, out var conceptId))
                    {
                        conceptIds.Add(conceptId);
                    }
                    else if (!string.IsNullOrEmpty(conStr))
                    {
                        tags.Add(conStr);
                    }
                }

                if (conceptIds.Count > 0)
                {
                    var conceptNames = await db.Concepts
                        .Where(c => conceptIds.Contains(c.Id))
                        .Select(c => c.Name)
                        .ToListAsync(cancellationToken);
                    tags.AddRange(conceptNames);
                }
            }

            var cleanTags = tags
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .Select(t => t.Trim())
                .Distinct()
                .ToList();

            return string.Join(", ", cleanTags);
        }
        catch
        {
            return preferredStyles;
        }
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
