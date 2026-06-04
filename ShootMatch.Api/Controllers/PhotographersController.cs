using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShootMatch.Api.Contracts;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;
using ShootMatch.Domain.Exceptions;
using ShootMatch.Domain.ValueObjects;
using System.Security.Claims;

namespace ShootMatch.Api.Controllers;

[ApiController]
[Route("api/photographers")]
[Authorize(Roles = "photographer")]
public sealed class PhotographersController(
    IPhotographerRepository photographerRepository,
    IServicePackageRepository servicePackageRepository,
    IPhotographerAvailabilityRepository availabilityRepository,
    IStorageService storageService) : ControllerBase
{
    [HttpGet("me")]
    [ProducesResponseType(typeof(Photographer), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMyProfile(CancellationToken cancellationToken)
    {
        var id = GetPhotographerIdOrThrow(User);
        var photographer = await photographerRepository.GetByIdAsync(id, cancellationToken);
        return photographer is null ? NotFound() : Ok(photographer);
    }

    [HttpGet("availability")]
    [ProducesResponseType(typeof(IReadOnlyList<PhotographerAvailability>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyAvailability([FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken cancellationToken)
    {
        var id = GetPhotographerIdOrThrow(User);
        var items = await availabilityRepository.GetByPhotographerIdAsync(id, from, to, cancellationToken);
        return Ok(items);
    }

    [HttpGet("{id:guid}/availability")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IReadOnlyList<PhotographerAvailability>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPhotographerAvailability(Guid id, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken cancellationToken)
    {
        var items = await availabilityRepository.GetByPhotographerIdAsync(id, from, to, cancellationToken);
        return Ok(items);
    }

    [HttpGet("{id:guid}/service-packages")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPhotographerServicePackagesPublic(Guid id, CancellationToken cancellationToken)
    {
        var packages = await servicePackageRepository.GetByPhotographerIdAsync(id, cancellationToken);
        var activePackages = packages.Where(p => p.IsActive).ToList();
        return Ok(activePackages);
    }

    [HttpPost("availability/block")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> BlockAvailability([FromBody] BlockPhotographerAvailabilityBatchRequest request, CancellationToken cancellationToken)
    {
        var id = GetPhotographerIdOrThrow(User);
        var blocks = request.Slots.Select(slot => new PhotographerAvailability
        {
            Id = Guid.NewGuid(),
            PhotographerId = id,
            SpecificDate = request.SpecificDate,
            StartTime = slot.StartTime,
            EndTime = slot.EndTime,
            SlotType = "Blocked",
            CreatedAt = DateTime.UtcNow,
        }).ToList();

        await availabilityRepository.UpsertBlocksAsync(id, blocks, cancellationToken);
        return NoContent();
    }

    [HttpDelete("availability/block")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UnblockAvailability([FromBody] BlockPhotographerAvailabilityBatchRequest request, CancellationToken cancellationToken)
    {
        var id = GetPhotographerIdOrThrow(User);
        var startTimes = request.Slots.Select(x => x.StartTime).ToList();
        await availabilityRepository.DeleteBlocksAsync(id, request.SpecificDate, startTimes, cancellationToken);
        return NoContent();
    }

    [HttpPut("profile")]
    [ProducesResponseType(typeof(Photographer), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateProfile(
        [FromBody] UpdatePhotographerProfileRequest request,
        CancellationToken cancellationToken)
    {
        var id = GetPhotographerIdOrThrow(User);
        var existing = await photographerRepository.GetByIdAsync(id, cancellationToken);
        if (existing is null) return NotFound();

        try
        {
            var updated = new Photographer
            {
                Id                    = existing.Id,
                Phone                 = existing.Phone,
                Email                 = existing.Email,
                DisplayName           = (request.DisplayName ?? existing.DisplayName).Trim(),
                Bio                   = (request.Bio ?? existing.Bio).Trim(),
                Quote                 = request.Quote is null
                    ? existing.Quote
                    : request.Quote.Trim(),
                AvatarUrl             = request.AvatarUrl ?? existing.AvatarUrl,
                CoverPhotoUrl         = request.CoverPhotoUrl ?? existing.CoverPhotoUrl,
                InstagramUrl          = request.InstagramUrl ?? existing.InstagramUrl,
                MinBudget             = request.MinBudget ?? existing.MinBudget,
                MaxBudget             = request.MaxBudget ?? existing.MaxBudget,
                AcceptsInstantBooking = request.AcceptsInstantBooking ?? existing.AcceptsInstantBooking,
                Region                = existing.Region,
                Rating                = existing.Rating,
                IsPremium             = existing.IsPremium,
                IsAvailable           = existing.IsAvailable,
                VerificationStatus    = existing.VerificationStatus,
                PasswordHash          = existing.PasswordHash,
                GoogleId              = existing.GoogleId,
                CreatedAt             = existing.CreatedAt,
                UpdatedAt             = DateTime.UtcNow,
                PortfolioEmbeddings   = existing.PortfolioEmbeddings
            };

            await photographerRepository.UpsertAsync(updated, cancellationToken);
            return Ok(updated);
        }
        catch (DomainException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("profile/avatar/upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadAvatar([FromForm] UploadPhotographerPhotoRequest request, CancellationToken ct)
    {
        return await UploadProfilePhoto(request.File, "avatar", ct);
    }

    [HttpPost("profile/cover/upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadCover([FromForm] UploadPhotographerPhotoRequest request, CancellationToken ct)
    {
        return await UploadProfilePhoto(request.File, "cover", ct);
    }

    [HttpPut("personal-info")]
    [ProducesResponseType(typeof(Photographer), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdatePersonalInfo(
        [FromBody] UpdatePhotographerPersonalInfoRequest request,
        CancellationToken cancellationToken)
    {
        var id = GetPhotographerIdOrThrow(User);
        var existing = await photographerRepository.GetByIdAsync(id, cancellationToken);
        if (existing is null) return NotFound();

        var updated = new Photographer
        {
            Id                            = existing.Id,
            Phone                         = request.Phone?.Trim() ?? existing.Phone,
            Email                         = request.Email?.Trim() ?? existing.Email,
            DisplayName                   = existing.DisplayName,
            Bio                           = existing.Bio,
            Quote                         = existing.Quote,
            NationalId                    = request.NationalId?.Trim() ?? existing.NationalId,
            Region                        = request.Region?.Trim() ?? existing.Region,
            PersonalAddress               = request.PersonalAddress?.Trim() ?? existing.PersonalAddress,
            VerificationDocumentFrontUrl  = request.VerificationDocumentFrontUrl ?? existing.VerificationDocumentFrontUrl,
            VerificationDocumentBackUrl   = request.VerificationDocumentBackUrl ?? existing.VerificationDocumentBackUrl,
            VerificationPortraitUrl       = request.VerificationPortraitUrl ?? existing.VerificationPortraitUrl,
            AvatarUrl                     = existing.AvatarUrl,
            CoverPhotoUrl                 = existing.CoverPhotoUrl,
            InstagramUrl                  = existing.InstagramUrl,
            MinBudget                     = existing.MinBudget,
            MaxBudget                     = existing.MaxBudget,
            AcceptsInstantBooking         = existing.AcceptsInstantBooking,
            Rating                        = existing.Rating,
            IsPremium                     = existing.IsPremium,
            IsAvailable                   = existing.IsAvailable,
            VerificationStatus            = existing.VerificationStatus,
            PasswordHash                  = existing.PasswordHash,
            GoogleId                      = existing.GoogleId,
            CreatedAt                     = existing.CreatedAt,
            UpdatedAt                     = DateTime.UtcNow,
            DeletedAt                     = existing.DeletedAt,
            PortfolioEmbeddings           = existing.PortfolioEmbeddings,
            PortfolioPhotos               = existing.PortfolioPhotos
        };

        await photographerRepository.UpsertAsync(updated, cancellationToken);
        return Ok(updated);
    }

    [HttpPost("verify")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitVerification(CancellationToken cancellationToken)
    {
        var id = GetPhotographerIdOrThrow(User);
        var existing = await photographerRepository.GetByIdAsync(id, cancellationToken);
        if (existing is null) return NotFound();

        if (existing.VerificationStatus == "Verified")
            return BadRequest("Profile is already verified.");
        if (existing.VerificationStatus == "Pending")
            return BadRequest("Verification already in progress.");

        var updated = new Photographer
        {
            Id                            = existing.Id,
            Phone                         = existing.Phone,
            Email                         = existing.Email,
            DisplayName                   = existing.DisplayName,
            Bio                           = existing.Bio,
            Quote                         = existing.Quote,
            NationalId                    = existing.NationalId,
            Region                        = existing.Region,
            PersonalAddress               = existing.PersonalAddress,
            VerificationDocumentFrontUrl  = existing.VerificationDocumentFrontUrl,
            VerificationDocumentBackUrl   = existing.VerificationDocumentBackUrl,
            VerificationPortraitUrl       = existing.VerificationPortraitUrl,
            AvatarUrl                     = existing.AvatarUrl,
            CoverPhotoUrl                 = existing.CoverPhotoUrl,
            InstagramUrl                  = existing.InstagramUrl,
            MinBudget                     = existing.MinBudget,
            MaxBudget                     = existing.MaxBudget,
            AcceptsInstantBooking         = existing.AcceptsInstantBooking,
            Rating                        = existing.Rating,
            IsPremium                     = existing.IsPremium,
            IsAvailable                   = existing.IsAvailable,
            VerificationStatus            = "Pending",
            PasswordHash                  = existing.PasswordHash,
            GoogleId                      = existing.GoogleId,
            CreatedAt                     = existing.CreatedAt,
            UpdatedAt                     = DateTime.UtcNow,
            DeletedAt                     = existing.DeletedAt,
            PortfolioEmbeddings           = existing.PortfolioEmbeddings,
            PortfolioPhotos               = existing.PortfolioPhotos
        };

        await photographerRepository.UpsertAsync(updated, cancellationToken);
        return Accepted();
    }

    [HttpGet("service-packages")]
    public async Task<IActionResult> GetServicePackages(CancellationToken cancellationToken)
    {
        var id = GetPhotographerIdOrThrow(User);
        var packages = await servicePackageRepository.GetByPhotographerIdAsync(id, cancellationToken);
        return Ok(packages);
    }

    [HttpGet("service-packages/{packageId:guid}")]
    public async Task<IActionResult> GetServicePackage(Guid packageId, CancellationToken cancellationToken)
    {
        var id = GetPhotographerIdOrThrow(User);
        var package = await servicePackageRepository.GetByIdAsync(id, packageId, cancellationToken);
        return package is null ? NotFound() : Ok(package);
    }

    [HttpPost("service-packages")]
    public async Task<IActionResult> CreateServicePackage([FromBody] ServicePackageRequest request, CancellationToken cancellationToken)
    {
        var id = GetPhotographerIdOrThrow(User);
        var package = await BuildServicePackageAsync(id, Guid.Empty, request, cancellationToken);
        return Ok(package);
    }

    [HttpPut("service-packages/{packageId:guid}")]
    public async Task<IActionResult> UpdateServicePackage(Guid packageId, [FromBody] UpdateServicePackageRequest request, CancellationToken cancellationToken)
    {
        var id = GetPhotographerIdOrThrow(User);
        var existing = await servicePackageRepository.GetByIdAsync(id, packageId, cancellationToken);
        if (existing is null) return NotFound();

        var package = await BuildServicePackageAsync(id, packageId, new ServicePackageRequest(
            request.Title,
            request.Description,
            request.Price,
            request.DurationHours,
            request.IsActive), cancellationToken);
        return Ok(package);
    }

    [HttpDelete("service-packages/{packageId:guid}")]
    public async Task<IActionResult> DeleteServicePackage(Guid packageId, CancellationToken cancellationToken)
    {
        var id = GetPhotographerIdOrThrow(User);
        await servicePackageRepository.DeleteAsync(id, packageId, cancellationToken);
        return NoContent();
    }

    private async Task<ServicePackage> BuildServicePackageAsync(
        Guid photographerId,
        Guid packageId,
        ServicePackageRequest request,
        CancellationToken cancellationToken)
    {
        var title = request.Title.Trim();
        var description = request.Description.Trim();

        if (string.IsNullOrWhiteSpace(title))
            throw new DomainException("Thiếu tiêu đề cho gói dịch vụ.");

        var package = new ServicePackage
        {
            Id = packageId == Guid.Empty ? Guid.NewGuid() : packageId,
            PhotographerId = photographerId,
            Title = title,
            Description = description,
            Price = request.Price,
            DurationHours = request.DurationHours,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow,
        };

        await servicePackageRepository.UpsertAsync(package, cancellationToken);
        return package;
    }

    private async Task<IActionResult> UploadProfilePhoto(IFormFile file, string kind, CancellationToken ct)
    {
        if (file.Length <= 0) return BadRequest("Empty file.");
        var id = GetPhotographerIdOrThrow(User);
        var existing = await photographerRepository.GetByIdAsync(id, ct);
        if (existing is null) return NotFound();

        await using var stream = file.OpenReadStream();
        var objectName = $"photographers/{id}/{kind}-{Guid.NewGuid():N}{System.IO.Path.GetExtension(file.FileName)}";
        var photoUrl = await storageService.UploadAsync(stream, objectName, file.ContentType ?? "application/octet-stream", ct);
        return Ok(new { photoUrl });
    }

    [HttpPost("service-packages/media/upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadServicePackageMedia([FromForm] UploadPhotographerPhotoRequest request, CancellationToken ct)
    {
        if (request.File.Length <= 0) return BadRequest("Empty file.");
        if (request.File.Length > 10 * 1024 * 1024) return BadRequest("File exceeds 10 MB limit.");
        
        var id = GetPhotographerIdOrThrow(User);
        
        await using var stream = request.File.OpenReadStream();
        var objectName = $"photographers/{id}/packages/{Guid.NewGuid():N}{System.IO.Path.GetExtension(request.File.FileName)}";
        var photoUrl = await storageService.UploadAsync(stream, objectName, request.File.ContentType ?? "image/jpeg", ct);
        
        return Ok(new { photoUrl });
    }

    private static Guid GetPhotographerIdOrThrow(ClaimsPrincipal user)
    {
        var claim = user.FindFirst("photographer_id")?.Value;
        if (!Guid.TryParse(claim, out var id)) throw new UnauthorizedAccessException("Missing photographer_id claim.");
        return id;
    }
}
