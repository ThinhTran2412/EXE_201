using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShootMatch.Api.Contracts;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;
using System.Security.Claims;

namespace ShootMatch.Api.Controllers;

/// <summary>
/// Admin management endpoints. Require role = "admin".
///
/// GET  /api/admin/photographers                      — list all photographers
/// GET  /api/admin/staff                               — list staff accounts
/// GET  /api/admin/verification-requests              — list pending verification requests
/// POST /api/admin/staff/{id}/approve                 — approve staff account
/// POST /api/admin/photographers/{id}/verify          — approve verification (with audit trail)
/// POST /api/admin/photographers/{id}/revoke-premium  — revoke premium flag
/// GET  /api/admin/reports/{scope}/{format}           — export PDF / Excel admin reports
/// </summary>
[ApiController]
[Route("api/admin")]
[Authorize(Roles = "admin")]
public sealed class AdminController(
    ICustomerRepository customerRepository,
    IBookingRepository bookingRepository,
    IPhotographerRepository photographerRepository,
    IStaffRepository staffRepository,
    IVerificationRequestRepository verificationRequestRepository,
    IStorageService storageService,
    IAdminReportExportService reportExportService) : ControllerBase
{
    [HttpGet("dashboard-stats")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboardStats(CancellationToken cancellationToken)
    {
        var customers = await customerRepository.GetAllAsync(cancellationToken);
        var photographers = await photographerRepository.GetAllAsync(cancellationToken);
        var bookings = await bookingRepository.GetAllAsync(cancellationToken);

        return Ok(new {
            TotalCustomers = customers.Count,
            TotalPhotographers = photographers.Count,
            TotalBookings = bookings.Count,
            TotalRevenue = bookings.Where(b => b.Status.ToString() == "Completed").Sum(b => b.AgreedPrice) * 0.1m
        });
    }

    [HttpGet("customers")]
    [ProducesResponseType(typeof(IReadOnlyList<Customer>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListCustomers(CancellationToken cancellationToken)
    {
        var all = await customerRepository.GetAllAsync(cancellationToken);
        return Ok(all);
    }

    [HttpPut("customers/{id:guid}")]
    [ProducesResponseType(typeof(Customer), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCustomer(Guid id, [FromBody] UpsertCustomerProfileRequest request, CancellationToken cancellationToken)
    {
        var existing = await customerRepository.GetByIdAsync(id, cancellationToken);
        if (existing is null) return NotFound();

        var updated = new Customer
        {
            Id = existing.Id,
            DisplayName = string.IsNullOrWhiteSpace(request.DisplayName) ? existing.DisplayName : request.DisplayName.Trim(),
            Phone = string.IsNullOrWhiteSpace(request.Phone) ? existing.Phone : request.Phone.Trim(),
            Email = string.IsNullOrWhiteSpace(request.Email) ? existing.Email : request.Email.Trim(),
            Region = string.IsNullOrWhiteSpace(request.Region) ? existing.Region : request.Region.Trim(),
            AvatarUrl = string.IsNullOrWhiteSpace(request.AvatarUrl) ? existing.AvatarUrl : request.AvatarUrl,
            CoverPhotoUrl = string.IsNullOrWhiteSpace(request.CoverPhotoUrl) ? existing.CoverPhotoUrl : request.CoverPhotoUrl,
            HighlightPhoto1Url = string.IsNullOrWhiteSpace(request.HighlightPhoto1Url) ? existing.HighlightPhoto1Url : request.HighlightPhoto1Url,
            HighlightPhoto2Url = string.IsNullOrWhiteSpace(request.HighlightPhoto2Url) ? existing.HighlightPhoto2Url : request.HighlightPhoto2Url,
            HighlightPhoto3Url = string.IsNullOrWhiteSpace(request.HighlightPhoto3Url) ? existing.HighlightPhoto3Url : request.HighlightPhoto3Url,
            RollPreviewPhotos = string.IsNullOrWhiteSpace(request.RollPreviewPhotos) ? existing.RollPreviewPhotos : request.RollPreviewPhotos,
            PreferredStyles = string.IsNullOrWhiteSpace(request.PreferredStyles) ? existing.PreferredStyles : request.PreferredStyles,
            IsVerified = existing.IsVerified,
            PreferredBudgetMin = existing.PreferredBudgetMin,
            PreferredBudgetMax = existing.PreferredBudgetMax,
            IsActive = existing.IsActive,
            PasswordHash = existing.PasswordHash,
            GoogleId = existing.GoogleId,
            CreatedAt = existing.CreatedAt,
            LastSeenAt = existing.LastSeenAt,
            DeletedAt = existing.DeletedAt
        };

        await customerRepository.UpsertAsync(updated, cancellationToken);
        return Ok(updated);
    }

    [HttpPost("customers/{id:guid}/avatar/upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadCustomerAvatar(Guid id, [FromForm] UploadCustomerPhotoRequest request, CancellationToken cancellationToken)
    {
        return await UploadPhoto(id, request.File, "customers/avatar", cancellationToken);
    }

    [HttpPost("customers/{id:guid}/cover/upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadCustomerCover(Guid id, [FromForm] UploadCustomerPhotoRequest request, CancellationToken cancellationToken)
    {
        return await UploadPhoto(id, request.File, "customers/cover", cancellationToken);
    }

    [HttpPost("profile/avatar/upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadMyAvatar([FromForm] UploadCustomerPhotoRequest request, CancellationToken cancellationToken)
    {
        var adminId = GetAdminId();
        if (adminId is null)
        {
            return Unauthorized(new { error = "Missing admin identity." });
        }

        return await UploadPhoto(adminId.Value, request.File, "admin/avatar", cancellationToken);
    }

    [HttpGet("bookings")]
    [ProducesResponseType(typeof(IReadOnlyList<Booking>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListBookings(CancellationToken cancellationToken)
    {
        var all = await bookingRepository.GetAllAsync(cancellationToken);
        return Ok(all);
    }

    [HttpGet("reports/{scope}/{format}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ExportReport(
        string scope,
        string format,
        [FromQuery] string? statusFilter,
        [FromQuery] string? dateRange,
        [FromQuery] string? search,
        CancellationToken cancellationToken)
    {
        var reportFilter = new AdminBookingReportFilter(statusFilter, dateRange, search);

        AdminReportFile? report = (scope.ToLowerInvariant(), format.ToLowerInvariant()) switch
        {
            ("dashboard", "pdf") => await reportExportService.BuildDashboardPdfAsync(cancellationToken),
            ("dashboard", "excel") => await reportExportService.BuildDashboardExcelAsync(cancellationToken),
            ("dashboard", "xlsx") => await reportExportService.BuildDashboardExcelAsync(cancellationToken),
            ("bookings", "pdf") => await reportExportService.BuildBookingsPdfAsync(reportFilter, cancellationToken),
            ("bookings", "excel") => await reportExportService.BuildBookingsExcelAsync(reportFilter, cancellationToken),
            ("bookings", "xlsx") => await reportExportService.BuildBookingsExcelAsync(reportFilter, cancellationToken),
            _ => null
        };

        if (report is null)
        {
            return BadRequest(new { error = "Unsupported report scope or format." });
        }

        return File(report.Content, report.ContentType, report.FileName);
    }

    /// <summary>Lists all photographers (admin view — includes unverified).</summary>
    [HttpGet("photographers")]
    [ProducesResponseType(typeof(IReadOnlyList<Photographer>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListPhotographers(CancellationToken cancellationToken)
    {
        var all = await photographerRepository.GetAllAsync(cancellationToken);
        return Ok(all);
    }

    [HttpGet("staff")]
    [ProducesResponseType(typeof(IReadOnlyList<Staff>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListStaff(CancellationToken cancellationToken)
    {
        var all = await staffRepository.GetAllAsync(cancellationToken);
        return Ok(all);
    }

    [HttpPost("staff/{id:guid}/approve")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApproveStaff(Guid id, CancellationToken cancellationToken)
    {
        var staff = await staffRepository.GetByIdAsync(id, cancellationToken);
        if (staff is null) return NotFound();

        await staffRepository.UpsertAsync(new Staff
        {
            Id = staff.Id,
            DisplayName = staff.DisplayName,
            Phone = staff.Phone,
            Email = staff.Email,
            Role = staff.Role,
            ApprovalStatus = "Approved",
            PasswordHash = staff.PasswordHash,
            GoogleId = staff.GoogleId,
            CreatedAt = staff.CreatedAt,
            UpdatedAt = DateTime.UtcNow,
            ApprovedAt = DateTime.UtcNow,
            ApprovedBy = User.FindFirst("user_id")?.Value,
            DeletedAt = staff.DeletedAt
        }, cancellationToken);

        return NoContent();
    }

    [HttpPut("photographers/{id:guid}")]
    [ProducesResponseType(typeof(Photographer), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdatePhotographer(Guid id, [FromBody] UpdatePhotographerProfileRequest request, CancellationToken cancellationToken)
    {
        var existing = await photographerRepository.GetByIdAsync(id, cancellationToken);
        if (existing is null) return NotFound();

        var updated = new Photographer
        {
            Id = existing.Id,
            Phone = string.IsNullOrWhiteSpace(request.Phone) ? existing.Phone : request.Phone.Trim(),
            Email = string.IsNullOrWhiteSpace(request.Email) ? existing.Email : request.Email.Trim(),
            DisplayName = string.IsNullOrWhiteSpace(request.DisplayName) ? existing.DisplayName : request.DisplayName.Trim(),
            Bio = string.IsNullOrWhiteSpace(request.Bio) ? existing.Bio : request.Bio.Trim(),
            Quote = request.Quote is null ? existing.Quote : request.Quote.Trim(),
            AvatarUrl = string.IsNullOrWhiteSpace(request.AvatarUrl) ? existing.AvatarUrl : request.AvatarUrl,
            CoverPhotoUrl = string.IsNullOrWhiteSpace(request.CoverPhotoUrl) ? existing.CoverPhotoUrl : request.CoverPhotoUrl,
            InstagramUrl = request.InstagramUrl is null ? existing.InstagramUrl : request.InstagramUrl.Trim(),
            MinBudget = request.MinBudget ?? existing.MinBudget,
            MaxBudget = request.MaxBudget ?? existing.MaxBudget,
            Region = string.IsNullOrWhiteSpace(request.Region) ? existing.Region : request.Region.Trim(),
            Rating = existing.Rating,
            IsPremium = existing.IsPremium,
            IsAvailable = existing.IsAvailable,
            AcceptsInstantBooking = request.AcceptsInstantBooking ?? existing.AcceptsInstantBooking,
            VerificationStatus = existing.VerificationStatus,
            PasswordHash = existing.PasswordHash,
            GoogleId = existing.GoogleId,
            CreatedAt = existing.CreatedAt,
            UpdatedAt = DateTime.UtcNow,
            DeletedAt = existing.DeletedAt,
            NationalId = existing.NationalId,
            PersonalAddress = existing.PersonalAddress,
            VerificationDocumentFrontUrl = existing.VerificationDocumentFrontUrl,
            VerificationDocumentBackUrl = existing.VerificationDocumentBackUrl,
            VerificationPortraitUrl = existing.VerificationPortraitUrl,
            PortfolioEmbeddings = existing.PortfolioEmbeddings,
            PortfolioPhotos = existing.PortfolioPhotos
        };

        await photographerRepository.UpsertAsync(updated, cancellationToken);
        return Ok(updated);
    }

    [HttpPost("photographers/{id:guid}/avatar/upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadPhotographerAvatar(Guid id, [FromForm] UploadPhotographerPhotoRequest request, CancellationToken cancellationToken)
    {
        return await UploadPhoto(id, request.File, "photographers/avatar", cancellationToken);
    }

    [HttpPost("photographers/{id:guid}/cover/upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadPhotographerCover(Guid id, [FromForm] UploadPhotographerPhotoRequest request, CancellationToken cancellationToken)
    {
        return await UploadPhoto(id, request.File, "photographers/cover", cancellationToken);
    }

    /// <summary>Lists all pending verification requests.</summary>
    [HttpGet("verification-requests")]
    [ProducesResponseType(typeof(IReadOnlyList<VerificationRequest>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListPendingVerifications(CancellationToken cancellationToken)
    {
        var pending = await verificationRequestRepository.GetAllPendingAsync(cancellationToken);
        return Ok(pending);
    }

    /// <summary>
    /// Approves a photographer's verification request.
    /// Updates both VerificationRequest (audit trail) and Photographer.VerificationStatus.
    /// </summary>
    [HttpPost("photographers/{id:guid}/verify")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ApproveVerification(Guid id, CancellationToken cancellationToken)
    {
        var photographer = await photographerRepository.GetByIdAsync(id, cancellationToken);
        if (photographer is null) return NotFound();
        if (photographer.VerificationStatus == "Verified")
            return BadRequest("Photographer is already verified.");

        var adminId = User.FindFirst("user_id")?.Value ?? "admin";

        // 1. Update VerificationRequest for audit trail
        var request = await verificationRequestRepository.GetPendingByPhotographerIdAsync(id, cancellationToken);
        if (request is not null)
        {
            var approved = new VerificationRequest
            {
                Id               = request.Id,
                PhotographerId   = request.PhotographerId,
                DocumentType     = request.DocumentType,
                DocumentImageUrl = request.DocumentImageUrl,
                SelfieUrl        = request.SelfieUrl,
                Status           = "Approved",
                ReviewedBy       = adminId,
                CreatedAt        = request.CreatedAt,
                ReviewedAt       = DateTime.UtcNow
            };
            await verificationRequestRepository.SaveAsync(approved, cancellationToken);
        }

        // 2. Flip VerificationStatus on Photographer
        await photographerRepository.UpsertAsync(
            BuildUpdated(photographer, verificationStatus: "Verified"), cancellationToken);

        return NoContent();
    }

    /// <summary>Revokes premium status (e.g. subscription expired).</summary>
    [HttpPost("photographers/{id:guid}/revoke-premium")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RevokePremium(Guid id, CancellationToken cancellationToken)
    {
        var p = await photographerRepository.GetByIdAsync(id, cancellationToken);
        if (p is null) return NotFound();

        await photographerRepository.UpsertAsync(BuildUpdated(p, isPremium: false), cancellationToken);
        return NoContent();
    }

    private async Task<IActionResult> UploadPhoto(Guid ownerId, IFormFile file, string kind, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });

        var contentType = file.ContentType?.ToLowerInvariant() ?? string.Empty;
        if (contentType is not ("image/jpeg" or "image/png" or "image/webp" or "image/heic"))
            return BadRequest(new { error = "Only JPEG, PNG, WebP or HEIC files are allowed." });

        var ext = System.IO.Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(ext)) ext = ".jpg";

        var safeName = $"admin/{kind}/{ownerId}/{Guid.NewGuid():N}{ext.ToLowerInvariant()}";
        var uploadContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "image/jpeg" : file.ContentType;

        await using var stream = file.OpenReadStream();
        var photoUrl = await storageService.UploadAsync(stream, safeName, uploadContentType, cancellationToken);
        return Ok(new { photoUrl });
    }

    private Guid? GetAdminId()
    {
        var rawId = User.FindFirst("user_id")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(rawId, out var adminId) ? adminId : null;
    }

    private static Photographer BuildUpdated(
        Photographer p,
        string? verificationStatus = null,
        bool? isPremium = null) => new()
    {
        Id = p.Id, Phone = p.Phone, Email = p.Email,
        DisplayName = p.DisplayName, Bio = p.Bio,
        AvatarUrl = p.AvatarUrl, CoverPhotoUrl = p.CoverPhotoUrl,
        InstagramUrl = p.InstagramUrl,
        MinBudget = p.MinBudget, MaxBudget = p.MaxBudget,
        Region = p.Region, Rating = p.Rating,
        IsPremium = isPremium ?? p.IsPremium,
        IsAvailable = p.IsAvailable,
        AcceptsInstantBooking = p.AcceptsInstantBooking,
        VerificationStatus = verificationStatus ?? p.VerificationStatus,
        CreatedAt = p.CreatedAt, UpdatedAt = DateTime.UtcNow,
        PortfolioEmbeddings = p.PortfolioEmbeddings
    };
}
