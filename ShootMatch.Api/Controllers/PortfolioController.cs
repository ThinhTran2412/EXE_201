using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShootMatch.Application.Abstractions;
using ShootMatch.Infrastructure.Persistence;
using ShootMatch.Infrastructure.Persistence.Entities;
using System.Security.Claims;

namespace ShootMatch.Api.Controllers;

[ApiController]
[Route("api/photographers/portfolio")]
[Authorize(Policy = "PhotographerOnly")]
public sealed class PortfolioController(
    IStorageService storage,
    ShootMatchDbContext db) : ControllerBase
{
    private static readonly string[] AllowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    private const long MaxSizeBytes = 10 * 1024 * 1024; // 10 MB

    [HttpGet]
    public async Task<IActionResult> GetMine(CancellationToken ct)
    {
        var photographerId = GetPhotographerIdOrThrow();
        var photos = await db.PortfolioPhotos
            .AsNoTracking()
            .Where(x => x.PhotographerId == photographerId)
            .OrderBy(x => x.DisplayOrder)
            .ThenByDescending(x => x.CreatedAt)
            .Select(x => x.ImageUrl)
            .ToListAsync(ct);

        return Ok(new { photos = photos.Select(NormalizePhotoUrl) });
    }

    /// <summary>Upload a single portfolio photo → returns { photoUrl }.</summary>
    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(10_485_760)]
    public async Task<IActionResult> Upload(
        IFormFile          file,
        CancellationToken  ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });

        if (file.Length > MaxSizeBytes)
            return BadRequest(new { error = "File exceeds 10 MB limit." });

        if (!AllowedTypes.Contains(file.ContentType.ToLowerInvariant()))
            return BadRequest(new { error = "Only JPEG, PNG, WebP or HEIC files are allowed." });

        var photographerId = GetPhotographerIdOrThrow();

        // Build a clean filename: {photographerId}/{guid}.{ext}
        var ext      = System.IO.Path.GetExtension(file.FileName).TrimStart('.').ToLowerInvariant();
        var fileName = $"{photographerId}/{Guid.NewGuid():N}.{ext}";

        using var stream  = file.OpenReadStream();
        var       url     = await storage.UploadAsync(stream, fileName, file.ContentType, ct);

        var maxOrder = await db.PortfolioPhotos
            .Where(x => x.PhotographerId == photographerId)
            .Select(x => (int?)x.DisplayOrder)
            .MaxAsync(ct) ?? 0;

        await db.PortfolioPhotos.AddAsync(new PortfolioPhotoRecord
        {
            Id = Guid.NewGuid(),
            PhotographerId = photographerId,
            ImageUrl = url,
            ThumbnailUrl = url,
            DisplayOrder = maxOrder + 1,
            IsIndexed = false,
            CreatedAt = DateTime.UtcNow
        }, ct);
        await db.SaveChangesAsync(ct);

        return Ok(new { photoUrl = url });
    }

    /// <summary>Delete a portfolio photo by its public URL.</summary>
    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] DeletePhotoRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.PhotoUrl))
            return BadRequest(new { error = "photoUrl is required." });

        var photographerId = GetPhotographerIdOrThrow();
        var requestedPath = TryGetAbsolutePath(req.PhotoUrl);
        var ownPhotos = await db.PortfolioPhotos
            .Where(x => x.PhotographerId == photographerId)
            .ToListAsync(ct);
        var record = ownPhotos.FirstOrDefault(x =>
            string.Equals(x.ImageUrl, req.PhotoUrl, StringComparison.OrdinalIgnoreCase) ||
            (!string.IsNullOrWhiteSpace(requestedPath) &&
             string.Equals(TryGetAbsolutePath(x.ImageUrl), requestedPath, StringComparison.OrdinalIgnoreCase)));

        if (record is not null)
        {
            db.PortfolioPhotos.Remove(record);
            await db.SaveChangesAsync(ct);
        }

        await storage.DeleteAsync(req.PhotoUrl, ct);
        return NoContent();
    }

    private string NormalizePhotoUrl(string url)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
            return url;

        var localhost = uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
            || uri.Host.Equals("127.0.0.1");
        if (!localhost || Request.Host.Host.Length == 0)
            return url;

        var builder = new UriBuilder(uri)
        {
            Scheme = Request.Scheme,
            Host = Request.Host.Host,
            Port = Request.Host.Port ?? uri.Port
        };
        return builder.Uri.ToString();
    }

    private static string? TryGetAbsolutePath(string url)
    {
        if (Uri.TryCreate(url, UriKind.Absolute, out var uri))
            return uri.AbsolutePath;
        return null;
    }

    private Guid GetPhotographerIdOrThrow()
    {
        var claim = User.FindFirst("photographer_id")?.Value
                    ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? User.FindFirstValue("sub");

        if (!Guid.TryParse(claim, out var photographerId))
            throw new UnauthorizedAccessException("Missing photographer_id claim.");

        return photographerId;
    }
}

public record DeletePhotoRequest(string PhotoUrl);
