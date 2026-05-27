using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShootMatch.Application.Abstractions;
using System.Security.Claims;

namespace ShootMatch.Api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public sealed class NotificationsController(INotificationRepository notifications) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] int pageSize = 30, CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var (recipientId, role) = GetCaller(User);
        var items = await notifications.GetForRecipientAsync(recipientId, role, (page - 1) * pageSize, pageSize, cancellationToken);
        var unread = await notifications.GetUnreadCountAsync(recipientId, role, cancellationToken);

        return Ok(new
        {
            page,
            pageSize,
            unreadCount = unread,
            items = items.Select(n => new
            {
                n.Id,
                n.Category,
                n.Title,
                n.Body,
                n.PayloadJson,
                n.ActionType,
                n.CreatedAt,
                n.ReadAt,
                read = n.ReadAt.HasValue,
            }),
        });
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount(CancellationToken cancellationToken)
    {
        var (recipientId, role) = GetCaller(User);
        var count = await notifications.GetUnreadCountAsync(recipientId, role, cancellationToken);
        return Ok(new { unreadCount = count });
    }

    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken cancellationToken)
    {
        var (recipientId, _) = GetCaller(User);
        var ok = await notifications.MarkReadAsync(id, recipientId, cancellationToken);
        return ok ? NoContent() : NotFound();
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead(CancellationToken cancellationToken)
    {
        var (recipientId, role) = GetCaller(User);
        var updated = await notifications.MarkAllReadAsync(recipientId, role, cancellationToken);
        return Ok(new { updated });
    }

    private static (Guid Id, string Role) GetCaller(ClaimsPrincipal user)
    {
        if (user.IsInRole("customer"))
        {
            var id = user.FindFirst("customer_id")?.Value;
            if (Guid.TryParse(id, out var customerId)) return (customerId, "customer");
        }
        if (user.IsInRole("photographer"))
        {
            var id = user.FindFirst("photographer_id")?.Value;
            if (Guid.TryParse(id, out var photographerId)) return (photographerId, "photographer");
        }
        throw new UnauthorizedAccessException("Unsupported role for notifications.");
    }
}
