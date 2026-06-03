using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;
using System.Security.Claims;

namespace ShootMatch.Api.Controllers;

[ApiController]
[Route("api/staff")]
[Authorize(Roles = "staff")]
public sealed class StaffController(
    IPhotographerRepository photographerRepository,
    IVerificationRequestRepository verificationRequestRepository) : ControllerBase
{
    [HttpGet("verification-requests")]
    [ProducesResponseType(typeof(IReadOnlyList<VerificationRequest>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListPendingVerifications(CancellationToken cancellationToken)
    {
        var pending = await verificationRequestRepository.GetAllPendingAsync(cancellationToken);
        return Ok(pending);
    }

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

        var staffId = User.FindFirst("user_id")?.Value ?? "staff";

        var request = await verificationRequestRepository.GetPendingByPhotographerIdAsync(id, cancellationToken);
        if (request is not null)
        {
            var approved = new VerificationRequest
            {
                Id = request.Id,
                PhotographerId = request.PhotographerId,
                DocumentType = request.DocumentType,
                DocumentImageUrl = request.DocumentImageUrl,
                SelfieUrl = request.SelfieUrl,
                Status = "Approved",
                ReviewedBy = staffId,
                CreatedAt = request.CreatedAt,
                ReviewedAt = DateTime.UtcNow
            };
            await verificationRequestRepository.SaveAsync(approved, cancellationToken);
        }

        await photographerRepository.UpsertAsync(BuildUpdated(photographer, verificationStatus: "Verified"), cancellationToken);
        return NoContent();
    }

    private static Photographer BuildUpdated(Photographer p, string? verificationStatus = null) => new()
    {
        Id = p.Id,
        Phone = p.Phone,
        Email = p.Email,
        DisplayName = p.DisplayName,
        Bio = p.Bio,
        AvatarUrl = p.AvatarUrl,
        CoverPhotoUrl = p.CoverPhotoUrl,
        InstagramUrl = p.InstagramUrl,
        MinBudget = p.MinBudget,
        MaxBudget = p.MaxBudget,
        Region = p.Region,
        Rating = p.Rating,
        IsPremium = p.IsPremium,
        IsAvailable = p.IsAvailable,
        AcceptsInstantBooking = p.AcceptsInstantBooking,
        VerificationStatus = verificationStatus ?? p.VerificationStatus,
        CreatedAt = p.CreatedAt,
        UpdatedAt = DateTime.UtcNow,
        PortfolioEmbeddings = p.PortfolioEmbeddings,
        PortfolioPhotos = p.PortfolioPhotos
    };
}