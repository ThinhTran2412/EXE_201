using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;
using ShootMatch.Infrastructure.Persistence;
using ShootMatch.Infrastructure.Persistence.Entities;
using System.Security.Claims;

namespace ShootMatch.Api.Controllers;

[ApiController]
[Route("api/staff")]
[Authorize(Roles = "staff")]
public sealed class StaffController(
    IPhotographerRepository photographerRepository,
    IVerificationRequestRepository verificationRequestRepository,
    ShootMatchDbContext db) : ControllerBase
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

    [HttpGet("tags/pending")]
    public async Task<IActionResult> ListPendingTags(CancellationToken ct)
    {
        var pendingStyles = await db.Styles
            .Where(x => x.Status == "Pending")
            .Select(x => new PendingTagDto("Style", x.Id, x.Name, x.Description, x.CreatedById, x.CreatedAt))
            .ToListAsync(ct);

        var pendingConcepts = await db.Concepts
            .Where(x => x.Status == "Pending")
            .Select(x => new PendingTagDto("Concept", x.Id, x.Name, x.Description, x.CreatedById, x.CreatedAt))
            .ToListAsync(ct);

        var allPending = pendingStyles.Concat(pendingConcepts).OrderByDescending(x => x.CreatedAt).ToList();
        return Ok(allPending);
    }

    [HttpPost("tags/approve")]
    public async Task<IActionResult> ApproveTag([FromBody] ReviewTagRequest request, CancellationToken ct)
    {
        var staffIdStr = User.FindFirst("user_id")?.Value ?? "staff";
        Guid? staffId = Guid.TryParse(staffIdStr, out var g) ? g : null;

        if (string.Equals(request.Type, "Style", StringComparison.OrdinalIgnoreCase))
        {
            var style = await db.Styles.FirstOrDefaultAsync(x => x.Id == request.Id, ct);
            if (style is null) return NotFound("Style not found.");
            
            var entry = db.Entry(style);
            style.Status = "Approved";
            style.ApprovedById = staffId;
            style.UpdatedAt = DateTime.UtcNow;
            entry.State = EntityState.Modified;
        }
        else if (string.Equals(request.Type, "Concept", StringComparison.OrdinalIgnoreCase))
        {
            var concept = await db.Concepts.FirstOrDefaultAsync(x => x.Id == request.Id, ct);
            if (concept is null) return NotFound("Concept not found.");
            
            var entry = db.Entry(concept);
            concept.Status = "Approved";
            concept.ApprovedById = staffId;
            concept.UpdatedAt = DateTime.UtcNow;
            entry.State = EntityState.Modified;
        }
        else
        {
            return BadRequest("Invalid tag type. Must be 'Style' or 'Concept'.");
        }

        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPost("tags/reject")]
    public async Task<IActionResult> RejectTag([FromBody] ReviewTagRequest request, CancellationToken ct)
    {
        var staffIdStr = User.FindFirst("user_id")?.Value ?? "staff";
        Guid? staffId = Guid.TryParse(staffIdStr, out var g) ? g : null;

        if (string.Equals(request.Type, "Style", StringComparison.OrdinalIgnoreCase))
        {
            var style = await db.Styles.FirstOrDefaultAsync(x => x.Id == request.Id, ct);
            if (style is null) return NotFound("Style not found.");
            
            var entry = db.Entry(style);
            style.Status = "Rejected";
            style.ApprovedById = staffId;
            style.UpdatedAt = DateTime.UtcNow;
            entry.State = EntityState.Modified;
        }
        else if (string.Equals(request.Type, "Concept", StringComparison.OrdinalIgnoreCase))
        {
            var concept = await db.Concepts.FirstOrDefaultAsync(x => x.Id == request.Id, ct);
            if (concept is null) return NotFound("Concept not found.");
            
            var entry = db.Entry(concept);
            concept.Status = "Rejected";
            concept.ApprovedById = staffId;
            concept.UpdatedAt = DateTime.UtcNow;
            entry.State = EntityState.Modified;
        }
        else
        {
            return BadRequest("Invalid tag type. Must be 'Style' or 'Concept'.");
        }

        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}

public record PendingTagDto(string Type, Guid Id, string Name, string Description, Guid? CreatedById, DateTime CreatedAt);
public record ReviewTagRequest(string Type, Guid Id);