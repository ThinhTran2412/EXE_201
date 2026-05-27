using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShootMatch.Application.Abstractions;
using System.Security.Claims;

namespace ShootMatch.Api.Controllers;

[ApiController]
[Route("api/conversations/{conversationId:guid}/media")]
[Authorize]
public sealed class ConversationMediaController(
    IConversationRepository conversations,
    IChatImageService chatImages) : ControllerBase
{
    private static readonly string[] AllowedTypes =
        ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif", "application/octet-stream"];
    private const long MaxSizeBytes = 8 * 1024 * 1024;

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(8_388_608)]
    public async Task<IActionResult> Upload(Guid conversationId, IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });
        if (file.Length > MaxSizeBytes)
            return BadRequest(new { error = "File exceeds 8 MB limit." });
        var contentType = NormalizeContentType(file.ContentType, file.FileName);
        if (!IsAllowedImage(contentType, file.FileName))
            return BadRequest(new { error = "Chỉ chấp nhận JPEG, PNG hoặc WebP." });

        var callerId = GetCallerId(User);
        var conversation = await conversations.GetConversationByIdAsync(conversationId, cancellationToken);
        if (conversation is null) return NotFound();
        if (conversation.CustomerId != callerId && conversation.PhotographerId != callerId)
            return Forbid();
        if (conversation.Status != "Active")
            return BadRequest(new { error = "Conversation is not active." });

        try
        {
            await using var stream = file.OpenReadStream();
            var result = await chatImages.UploadAsync(stream, file.FileName, contentType, conversationId, cancellationToken);

            return Ok(new
            {
                photoUrl = result.PhotoUrl,
                previewUrl = result.PreviewUrl,
                expiresAt = result.ExpiresAt,
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Không xử lý được ảnh. Thử ảnh JPEG nhỏ hơn.", detail = ex.Message });
        }
    }

    private static string NormalizeContentType(string? contentType, string fileName)
    {
        var type = (contentType ?? string.Empty).Trim().ToLowerInvariant();
        if (type is "application/octet-stream" or "")
            type = GuessFromExtension(fileName);
        if (type == "image/jpg") type = "image/jpeg";
        return type;
    }

    private static string GuessFromExtension(string fileName)
    {
        var ext = System.IO.Path.GetExtension(fileName).TrimStart('.').ToLowerInvariant();
        if (ext is "jpg" or "jpeg") return "image/jpeg";
        if (ext is "png") return "image/png";
        if (ext is "webp") return "image/webp";
        return "image/jpeg";
    }

    private static bool IsAllowedImage(string contentType, string fileName)
    {
        if (AllowedTypes.Contains(contentType)) return true;
        var ext = System.IO.Path.GetExtension(fileName).TrimStart('.').ToLowerInvariant();
        return ext is "jpg" or "jpeg" or "png" or "webp";
    }

    private static Guid GetCallerId(ClaimsPrincipal user)
    {
        var claim = user.FindFirst("customer_id")?.Value
            ?? user.FindFirst("photographer_id")?.Value
            ?? user.FindFirst("staff_id")?.Value;
        return Guid.TryParse(claim, out var id) ? id : throw new UnauthorizedAccessException("Missing caller id claim.");
    }
}
