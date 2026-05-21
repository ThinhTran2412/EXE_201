using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShootMatch.Api.Contracts;
using ShootMatch.Application.Abstractions;
using ShootMatch.Application.Commands;
using ShootMatch.Domain.Entities;
using ShootMatch.Domain.Exceptions;
using System.Security.Claims;

namespace ShootMatch.Api.Controllers;

[ApiController]
[Route("api/calls")]
[Authorize]
public sealed class CallsController(
    InitiateCallCommandHandler initiateHandler,
    UpdateCallSessionCommandHandler updateHandler,
    ICallSessionRepository callSessionRepository,
    IConversationRepository conversationRepository) : ControllerBase
{
    [HttpPost("start")]
    public async Task<IActionResult> Start([FromBody] StartCallRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var session = await initiateHandler.HandleAsync(new InitiateCallCommand(request.ConversationId, GetCallerId(User), GetCallerRole(User), request.CallType, request.SessionToken), cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = session.Id }, ToDto(session));
        }
        catch (DomainException ex) { return BadRequest(ex.Message); }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var session = await callSessionRepository.GetByIdAsync(id, cancellationToken);
        return session is null ? NotFound() : Ok(ToDto(session));
    }

    [HttpGet("conversation/{conversationId:guid}")]
    public async Task<IActionResult> GetByConversation(Guid conversationId, CancellationToken cancellationToken)
    {
        var conversation = await conversationRepository.GetConversationByIdAsync(conversationId, cancellationToken);
        if (conversation is null) return NotFound();
        if (!IsParticipant(conversation.CustomerId, conversation.PhotographerId, User)) return Forbid();
        var sessions = await callSessionRepository.GetByConversationIdAsync(conversationId, cancellationToken);
        return Ok(sessions.Select(ToDto));
    }

    [HttpPost("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateCallRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var session = await updateHandler.HandleAsync(new UpdateCallSessionCommand(id, request.Status, GetCallerId(User), GetCallerRole(User), EndReason: request.EndReason, SessionToken: request.SessionToken), cancellationToken);
            return Ok(ToDto(session));
        }
        catch (DomainException ex) { return BadRequest(ex.Message); }
    }

    private static object ToDto(CallSession session) => new { session.Id, session.ConversationId, session.CallType, session.Status, session.InitiatorId, session.InitiatorRole, session.StartedAt, session.AnsweredAt, session.EndedAt, session.EndReason, session.SessionToken, session.LastSignalAt };
    private static Guid GetCallerId(ClaimsPrincipal user) { var claim = user.FindFirst("customer_id")?.Value ?? user.FindFirst("photographer_id")?.Value ?? user.FindFirst("staff_id")?.Value; return Guid.TryParse(claim, out var id) ? id : throw new UnauthorizedAccessException("Missing caller id claim."); }
    private static string GetCallerRole(ClaimsPrincipal user) => user.FindFirst(ClaimTypes.Role)?.Value ?? throw new UnauthorizedAccessException("Missing role claim.");
    private static bool IsParticipant(Guid customerId, Guid photographerId, ClaimsPrincipal user) { var caller = GetCallerId(user); return caller == customerId || caller == photographerId; }
}
