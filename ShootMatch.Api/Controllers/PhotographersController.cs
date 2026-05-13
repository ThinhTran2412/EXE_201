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
            Region                        = existing.Region,
            Rating                        = existing.Rating,
            IsPremium                     = existing.IsPremium,
            IsAvailable                   = existing.IsAvailable,
            VerificationStatus            = existing.VerificationStatus,
            PasswordHash                  = existing.PasswordHash,
            GoogleId                      = existing.GoogleId,
            CreatedAt                     = existing.CreatedAt,
            UpdatedAt                     = DateTime.UtcNow,
            PortfolioEmbeddings           = existing.PortfolioEmbeddings
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
            Id                    = existing.Id,
            Phone                 = existing.Phone,
            Email                 = existing.Email,
            DisplayName           = existing.DisplayName,
            Bio                   = existing.Bio,
            Quote                 = existing.Quote,
            AvatarUrl             = existing.AvatarUrl,
            CoverPhotoUrl         = existing.CoverPhotoUrl,
            InstagramUrl          = existing.InstagramUrl,
            MinBudget             = existing.MinBudget,
            MaxBudget             = existing.MaxBudget,
            AcceptsInstantBooking = existing.AcceptsInstantBooking,
            Region                = existing.Region,
            Rating                = existing.Rating,
            IsPremium             = existing.IsPremium,
            IsAvailable           = existing.IsAvailable,
            VerificationStatus    = "Pending",
            CreatedAt             = existing.CreatedAt,
            UpdatedAt             = DateTime.UtcNow,
            PortfolioEmbeddings   = existing.PortfolioEmbeddings
        };

        await photographerRepository.UpsertAsync(updated, cancellationToken);
        return Accepted();
    }

    private async Task<IActionResult> UploadProfilePhoto(IFormFile file, string kind, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });

        var contentType = file.ContentType?.ToLowerInvariant() ?? string.Empty;
        if (contentType is not ("image/jpeg" or "image/png" or "image/webp" or "image/heic"))
            return BadRequest(new { error = "Only JPEG, PNG, WebP or HEIC files are allowed." });

        var ext = System.IO.Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(ext)) ext = ".jpg";

        var photographerId = GetPhotographerIdOrThrow(User);
        var safeName = $"{kind}/{photographerId}/{Guid.NewGuid():N}{ext.ToLowerInvariant()}";
        var uploadContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "image/jpeg" : file.ContentType;

        await using var stream = file.OpenReadStream();
        var photoUrl = await storageService.UploadAsync(stream, safeName, uploadContentType, ct);
        return Ok(new { photoUrl });
    }

    private static Guid GetPhotographerIdOrThrow(ClaimsPrincipal user)
    {
        var claim = user.FindFirst("photographer_id")?.Value;
        if (!Guid.TryParse(claim, out var id))
            throw new UnauthorizedAccessException("Missing photographer_id claim.");
        return id;
    }
}
