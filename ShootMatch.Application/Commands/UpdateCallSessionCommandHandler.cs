using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;
using ShootMatch.Domain.Exceptions;

namespace ShootMatch.Application.Commands;

public sealed class UpdateCallSessionCommandHandler(
    ICallSessionRepository callSessionRepository,
    IConversationRepository conversationRepository)
{
    public async Task<CallSession> HandleAsync(UpdateCallSessionCommand command, CancellationToken cancellationToken = default)
    {
        var call = await callSessionRepository.GetByIdAsync(command.CallSessionId, cancellationToken)
            ?? throw new DomainException($"Call session {command.CallSessionId} not found.");

        var conversation = await conversationRepository.GetConversationByIdAsync(call.ConversationId, cancellationToken)
            ?? throw new DomainException("Conversation not found for call session.");

        var isParticipant = conversation.CustomerId == command.ActorId || conversation.PhotographerId == command.ActorId;
        if (!isParticipant)
            throw new DomainException("Actor is not a participant of this conversation.");

        await callSessionRepository.UpdateStatusAsync(
            command.CallSessionId,
            NormalizeStatus(command.Status),
            command.AnsweredAt,
            command.EndedAt,
            command.EndReason,
            command.SessionToken,
            DateTime.UtcNow,
            cancellationToken);

        return (await callSessionRepository.GetByIdAsync(command.CallSessionId, cancellationToken))!;
    }

    private static string NormalizeStatus(string status)
        => status.ToLowerInvariant() switch
        {
            "ring" => "ringing",
            "calling" => "ringing",
            "start" => "ringing",
            "accept" => "active",
            "active" => "active",
            "reject" => "rejected",
            "rejected" => "rejected",
            "cancel" => "cancelled",
            "cancelled" => "cancelled",
            "end" => "ended",
            "ended" => "ended",
            "missed" => "missed",
            _ => throw new DomainException($"Unsupported call status '{status}'.")
        };
}
