using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using ShootMatch.Application.Abstractions;
using ShootMatch.Application.Commands;
using ShootMatch.Domain.Entities;
using ShootMatch.Domain.Exceptions;
using System.Security.Claims;

namespace ShootMatch.Api.Hubs;

[Authorize]
public sealed class ChatHub(
    IConversationRepository conversationRepository,
    SendMessageCommandHandler messageHandler,
    InitiateCallCommandHandler initiateCallHandler,
    UpdateCallSessionCommandHandler updateCallSessionHandler,
    MarkConversationReadCommandHandler markReadHandler,
    ICallSessionRepository callSessionRepository,
    ShootMatch.Application.Services.NotificationService notificationService) : Hub
{
    public async Task JoinConversation(Guid conversationId)
    {
        var (senderId, _) = GetCallerIdentity(Context.User);
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
        await Groups.AddToGroupAsync(Context.ConnectionId, ConversationGroupName(conversationId));
    }

    public async Task LeaveConversation(Guid conversationId) => await Groups.RemoveFromGroupAsync(Context.ConnectionId, ConversationGroupName(conversationId));
    public async Task SendMessage(Guid conversationId, string content) => await SendInternal(conversationId, content, "Text");
    public async Task SendImageMessage(Guid conversationId, string imageUrl, string previewUrl)
        => await SendInternal(conversationId, imageUrl, "Image", previewUrl);

    public async Task MarkRead(Guid conversationId)
    {
        var (senderId, senderRole) = GetCallerIdentity(Context.User);
        try
        {
            var updated = await markReadHandler.HandleAsync(new MarkConversationReadCommand(conversationId, senderId, senderRole));
            await Clients.Group(ConversationGroupName(conversationId)).SendAsync("ConversationRead", new { ConversationId = conversationId, ReaderId = senderId, Updated = updated, ReadAt = DateTime.UtcNow });
        }
        catch (DomainException ex) { await Clients.Caller.SendAsync("Error", ex.Message); }
    }

    public async Task StartCall(Guid conversationId, string callType, string? sessionToken = null)
    {
        var (senderId, senderRole) = GetCallerIdentity(Context.User);
        try
        {
            var call = await initiateCallHandler.HandleAsync(new InitiateCallCommand(conversationId, senderId, senderRole, callType, sessionToken));
            await Clients.Group(ConversationGroupName(conversationId)).SendAsync("ReceiveCallEvent", new { call.Id, call.ConversationId, call.CallType, call.Status, call.InitiatorId, call.InitiatorRole, call.StartedAt, call.SessionToken, Event = "ring" });
        }
        catch (DomainException ex) { await Clients.Caller.SendAsync("Error", ex.Message); }
    }

    public async Task AcceptCall(Guid callSessionId, string? sessionToken = null) => await UpdateCallState(callSessionId, "active", answeredAt: DateTime.UtcNow, sessionToken: sessionToken, eventName: "accept");
    public async Task RejectCall(Guid callSessionId, string reason = "rejected") => await UpdateCallState(callSessionId, "rejected", endedAt: DateTime.UtcNow, endReason: reason, eventName: "reject");
    public async Task EndCall(Guid callSessionId, string reason = "ended") => await UpdateCallState(callSessionId, "ended", endedAt: DateTime.UtcNow, endReason: reason, eventName: "hangup");
    public async Task CancelCall(Guid callSessionId, string reason = "cancelled") => await UpdateCallState(callSessionId, "cancelled", endedAt: DateTime.UtcNow, endReason: reason, eventName: "cancel");

    public async Task SendCallSignal(Guid callSessionId, string signalType, string payloadJson)
    {
        var (senderId, senderRole) = GetCallerIdentity(Context.User);
        try
        {
            var call = await callSessionRepository.GetByIdAsync(callSessionId) ?? throw new DomainException($"Call session {callSessionId} not found.");
            var conversation = await conversationRepository.GetConversationByIdAsync(call.ConversationId) ?? throw new DomainException("Conversation not found for call session.");
            if (!IsParticipant(conversation, senderId)) throw new DomainException("Sender is not a participant of this conversation.");
            await Clients.Group(CallGroupName(callSessionId)).SendAsync("ReceiveCallSignal", new { Id = Guid.NewGuid(), CallSessionId = callSessionId, call.ConversationId, SenderId = senderId, SenderRole = senderRole, SignalType = signalType, PayloadJson = payloadJson, SentAt = DateTime.UtcNow });
        }
        catch (DomainException ex) { await Clients.Caller.SendAsync("Error", ex.Message); }
    }

    public async Task JoinCallRoom(Guid callSessionId)
    {
        var (senderId, _) = GetCallerIdentity(Context.User);
        var call = await callSessionRepository.GetByIdAsync(callSessionId);
        if (call is null)
        {
            await Clients.Caller.SendAsync("Error", "Call session not found.");
            return;
        }
        var conversation = await conversationRepository.GetConversationByIdAsync(call.ConversationId);
        if (conversation is null || !IsParticipant(conversation, senderId))
        {
            await Clients.Caller.SendAsync("Error", "Not allowed to join this call room.");
            return;
        }
        await Groups.AddToGroupAsync(Context.ConnectionId, CallGroupName(callSessionId));
    }

    private async Task SendInternal(Guid conversationId, string content, string contentType, string? mediaPreviewUrl = null)
    {
        var (senderId, senderRole) = GetCallerIdentity(Context.User);
        try
        {
            var conversation = await conversationRepository.GetConversationByIdAsync(conversationId)
                ?? throw new DomainException($"Conversation {conversationId} not found.");

            var message = await messageHandler.HandleAsync(new SendMessageCommand(
                conversationId, senderId, senderRole, content, contentType, mediaPreviewUrl));

            await Clients.Group(ConversationGroupName(conversationId)).SendAsync("ReceiveMessage", new
            {
                message.Id,
                message.ConversationId,
                message.SenderId,
                message.SenderRole,
                content = message.DisplayContent,
                message.ContentType,
                message.SentAt,
                message.MediaPreviewUrl,
                message.MediaExpiresAt,
            });

            var senderName = senderRole == "customer"
                ? (conversation.CustomerDisplayName ?? "Khách hàng")
                : (conversation.PhotographerDisplayName ?? "Nhiếp ảnh gia");

            var notification = await notificationService.NotifyNewMessageAsync(
                conversation, message, senderName);

            var recipientId = senderRole == "customer"
                ? conversation.PhotographerId
                : conversation.CustomerId;

            await Clients.User(recipientId.ToString()).SendAsync("ReceiveNotification", new
            {
                notification.Id,
                notification.Category,
                notification.Title,
                notification.Body,
                notification.PayloadJson,
                notification.ActionType,
                notification.CreatedAt,
                read = false,
            });
        }
        catch (DomainException ex) { await Clients.Caller.SendAsync("Error", ex.Message); }
    }

    private async Task UpdateCallState(Guid callSessionId, string status, DateTime? answeredAt = null, DateTime? endedAt = null, string? endReason = null, string? sessionToken = null, string? eventName = null)
    {
        var (senderId, senderRole) = GetCallerIdentity(Context.User);
        try
        {
            await updateCallSessionHandler.HandleAsync(new UpdateCallSessionCommand(callSessionId, status, senderId, senderRole, answeredAt, endedAt, endReason, sessionToken));
            var call = await callSessionRepository.GetByIdAsync(callSessionId);
            if (call is null) return;
            await Clients.Group(ConversationGroupName(call.ConversationId)).SendAsync("ReceiveCallEvent", new { call.Id, call.ConversationId, call.CallType, call.Status, call.InitiatorId, call.InitiatorRole, call.StartedAt, call.AnsweredAt, call.EndedAt, call.EndReason, call.SessionToken, Event = eventName ?? status });
        }
        catch (DomainException ex) { await Clients.Caller.SendAsync("Error", ex.Message); }
    }

    private static bool IsParticipant(Conversation conversation, Guid callerId) => conversation.CustomerId == callerId || conversation.PhotographerId == callerId;
    private static string ConversationGroupName(Guid conversationId) => $"conv-{conversationId:N}";
    private static string CallGroupName(Guid callSessionId) => $"call-{callSessionId:N}";

    private static (Guid senderId, string senderRole) GetCallerIdentity(ClaimsPrincipal? user)
    {
        if (user is null) throw new HubException("Unauthenticated.");
        var role = user.FindFirst(ClaimTypes.Role)?.Value ?? throw new HubException("Missing role claim.");
        var idClaim = role switch
        {
            "customer" => user.FindFirst("customer_id")?.Value,
            "photographer" => user.FindFirst("photographer_id")?.Value,
            "staff" => user.FindFirst("staff_id")?.Value,
            "admin" => user.FindFirst("staff_id")?.Value ?? user.FindFirst("admin_id")?.Value,
            _ => null
        };
        if (!Guid.TryParse(idClaim, out var senderId)) throw new HubException($"Missing {role}_id claim.");
        return (senderId, role);
    }
}
