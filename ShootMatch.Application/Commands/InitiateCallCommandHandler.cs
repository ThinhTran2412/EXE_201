using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;
using ShootMatch.Domain.Exceptions;

namespace ShootMatch.Application.Commands;

public sealed class InitiateCallCommandHandler(
    IConversationRepository conversationRepository,
    ICallSessionRepository callSessionRepository)
{
    public async Task<CallSession> HandleAsync(InitiateCallCommand command, CancellationToken cancellationToken = default)
    {
        var conversation = await conversationRepository.GetConversationByIdAsync(command.ConversationId, cancellationToken)
            ?? throw new DomainException($"Conversation {command.ConversationId} not found.");

        if (conversation.Status != "Active")
            throw new DomainException("Cannot start a call on a non-Active conversation.");

        var isParticipant = conversation.CustomerId == command.InitiatorId || conversation.PhotographerId == command.InitiatorId;
        if (!isParticipant)
            throw new DomainException("Initiator is not a participant of this conversation.");

        var activeCall = await callSessionRepository.GetActiveByConversationIdAsync(command.ConversationId, cancellationToken);
        if (activeCall is not null)
            throw new DomainException("There is already an active call for this conversation.");

        var call = new CallSession
        {
            Id = Guid.NewGuid(),
            ConversationId = command.ConversationId,
            CallType = NormalizeCallType(command.CallType),
            Status = "ringing",
            InitiatorId = command.InitiatorId,
            InitiatorRole = command.InitiatorRole,
            StartedAt = DateTime.UtcNow,
            SessionToken = command.SessionToken,
            LastSignalAt = DateTime.UtcNow
        };

        await callSessionRepository.SaveAsync(call, cancellationToken);
        return call;
    }

    private static string NormalizeCallType(string callType)
        => string.Equals(callType, "video", StringComparison.OrdinalIgnoreCase) ? "video" : "audio";
}
