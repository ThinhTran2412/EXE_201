using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShootMatch.Api.Contracts;
using ShootMatch.Application.Abstractions;
using ShootMatch.Application.Commands;
using System.Security.Claims;

namespace ShootMatch.Api.Controllers;

[ApiController]
[Route("api/conversations")]
[Authorize]
public sealed class ConversationsController(
    IConversationQueryService queryService,
    MarkConversationReadCommandHandler markReadHandler,
    IConversationRepository conversationRepository) : ControllerBase
{
    [HttpGet("inbox")]
    public async Task<IActionResult> Inbox([FromQuery] InboxRequest request, CancellationToken cancellationToken)
    {
        var userId = GetCallerId(User);
        var role = GetCallerRole(User);
        var inbox = await queryService.GetInboxAsync(userId, role, cancellationToken);
        var paged = inbox.Skip((request.Page - 1) * request.PageSize).Take(request.PageSize).ToList();
        return Ok(new { Page = request.Page, PageSize = request.PageSize, Total = inbox.Count, Items = paged });
    }

    [HttpGet("{conversationId:guid}/messages")]
    public async Task<IActionResult> Messages(Guid conversationId, [FromQuery] GetConversationMessagesRequest request, CancellationToken cancellationToken)
    {
        var messages = await queryService.GetMessagesAsync(conversationId, GetCallerId(User), cancellationToken);
        var paged = messages.Skip((request.Page - 1) * request.PageSize).Take(request.PageSize).ToList();
        return Ok(new { Page = request.Page, PageSize = request.PageSize, Total = messages.Count, Items = paged });
    }

    [HttpPost("{conversationId:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid conversationId, CancellationToken cancellationToken)
    {
        await markReadHandler.HandleAsync(new MarkConversationReadCommand(conversationId, GetCallerId(User), GetCallerRole(User)), cancellationToken);
        return NoContent();
    }

    [HttpGet("{conversationId:guid}/unread-count")]
    public async Task<IActionResult> UnreadCount(Guid conversationId, CancellationToken cancellationToken)
    {
        var conversation = await conversationRepository.GetConversationByIdAsync(conversationId, cancellationToken);
        if (conversation is null) return NotFound();
        var caller = GetCallerId(User);
        if (conversation.CustomerId != caller && conversation.PhotographerId != caller) return Forbid();
        var count = await conversationRepository.GetUnreadCountAsync(conversationId, caller, cancellationToken);
        return Ok(new { ConversationId = conversationId, UnreadCount = count });
    }

    private static Guid GetCallerId(ClaimsPrincipal user)
    {
        var claim = user.FindFirst("customer_id")?.Value ?? user.FindFirst("photographer_id")?.Value ?? user.FindFirst("staff_id")?.Value;
        return Guid.TryParse(claim, out var id) ? id : throw new UnauthorizedAccessException("Missing caller id claim.");
    }

    private static string GetCallerRole(ClaimsPrincipal user)
        => user.FindFirst(ClaimTypes.Role)?.Value ?? throw new UnauthorizedAccessException("Missing role claim.");
}
