using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;
using System.Security.Claims;

namespace ShootMatch.Api.Controllers;

/// <summary>
/// Admin management endpoints. Require role = "admin".
///
/// GET  /api/admin/photographers                      — list all photographers
/// GET  /api/admin/verification-requests              — list pending verification requests
/// POST /api/admin/photographers/{id}/verify          — approve verification (with audit trail)
/// POST /api/admin/photographers/{id}/revoke-premium  — revoke premium flag
/// </summary>
[ApiController]
[Route("api/admin")]
[Authorize(Roles = "admin")]
public sealed class AdminController(
    IPhotographerRepository photographerRepository,
    IVerificationRequestRepository verificationRequestRepository) : ControllerBase
{
    /// <summary>Lists all photographers (admin view — includes unverified).</summary>
    [HttpGet("photographers")]
    [ProducesResponseType(typeof(IReadOnlyList<Photographer>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListPhotographers(CancellationToken cancellationToken)
    {
        var all = await photographerRepository.GetAllAsync(cancellationToken);
        return Ok(all);
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
