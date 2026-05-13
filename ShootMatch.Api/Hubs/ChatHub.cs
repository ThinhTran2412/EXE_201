using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using ShootMatch.Application.Abstractions;
using ShootMatch.Application.Commands;
using ShootMatch.Domain.Entities;
using ShootMatch.Domain.Exceptions;
using System.Security.Claims;

namespace ShootMatch.Api.Hubs;

/// <summary>
/// SignalR Hub for real-time messaging between matched Customers and Photographers.
/// 
/// WebSocket URL: wss://host/hubs/chat
/// Requires: Authorization header with Bearer JWT (customer or photographer token).
///
/// Client protocol:
///   → JoinConversation(conversationId)         — subscribe to a conversation room
///   → SendMessage(conversationId, content)     — send text message
///   → SendImageMessage(conversationId, url)    — send image (URL already uploaded)
///   → LeaveConversation(conversationId)        — unsubscribe
///
///   ← ReceiveMessage(Message)                  — server pushes new messages to room
///   ← Error(string)                            — server sends error string
/// </summary>
[Authorize]
public sealed class ChatHub(
    IConversationRepository conversationRepository,
    SendMessageCommandHandler messageHandler) : Hub
{
    // ── Client → Server ───────────────────────────────────────────────────────

    /// <summary>
    /// Adds the caller to the SignalR group for this conversation.
    /// Verifies the caller is a participant before joining.
    /// </summary>
    public async Task JoinConversation(Guid conversationId)
    {
        var (senderId, senderRole) = GetCallerIdentity(Context.User);

        var conversation = await conversationRepository.GetConversationByIdAsync(conversationId);
        if (conversation is null)
        {
            await Clients.Caller.SendAsync("Error", "Conversation not found.");
            return;
        }

        if (!IsParticipant(conversation, senderId))
        {
            await Clients.Caller.SendAsync("Error", "Not a participant of this conversation.");
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(conversationId));
    }

    /// <summary>Sends a text message to the conversation and broadcasts to all participants.</summary>
    public async Task SendMessage(Guid conversationId, string content)
        => await SendInternal(conversationId, content, "Text");

    /// <summary>Sends an image message (content = pre-uploaded image URL).</summary>
    public async Task SendImageMessage(Guid conversationId, string imageUrl)
        => await SendInternal(conversationId, imageUrl, "Image");

    /// <summary>Removes the caller from the conversation group.</summary>
    public async Task LeaveConversation(Guid conversationId)
        => await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(conversationId));

    // ── Internal helpers ─────────────────────────────────────────────────────

    private async Task SendInternal(Guid conversationId, string content, string contentType)
    {
        var (senderId, senderRole) = GetCallerIdentity(Context.User);

        try
        {
            var message = await messageHandler.HandleAsync(new SendMessageCommand(
                ConversationId: conversationId,
                SenderId:       senderId,
                SenderRole:     senderRole,
                Content:        content,
                ContentType:    contentType));

            // Broadcast to all group members (including sender for echo confirmation)
            await Clients.Group(GroupName(conversationId))
                .SendAsync("ReceiveMessage", new
                {
                    message.Id,
                    message.ConversationId,
                    message.SenderId,
                    message.SenderRole,
                    message.Content,
                    message.ContentType,
                    message.SentAt
                });
        }
        catch (DomainException ex)
        {
            await Clients.Caller.SendAsync("Error", ex.Message);
        }
    }

    private static bool IsParticipant(Conversation conversation, Guid callerId)
        => conversation.CustomerId == callerId || conversation.PhotographerId == callerId;

    private static string GroupName(Guid conversationId)
        => $"conv-{conversationId:N}";

    private static (Guid senderId, string senderRole) GetCallerIdentity(ClaimsPrincipal? user)
    {
        if (user is null) throw new HubException("Unauthenticated.");

        var role = user.FindFirst(ClaimTypes.Role)?.Value
            ?? throw new HubException("Missing role claim.");

        var idClaim = role == "customer"
            ? user.FindFirst("customer_id")?.Value
            : user.FindFirst("photographer_id")?.Value;

        if (!Guid.TryParse(idClaim, out var senderId))
            throw new HubException($"Missing {role}_id claim.");

        return (senderId, role);
    }
}
