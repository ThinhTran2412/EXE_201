using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;
using ShootMatch.Domain.Exceptions;

namespace ShootMatch.Application.Commands;

public sealed class MarkConversationReadCommandHandler(IConversationRepository conversationRepository)
{
    public async Task<int> HandleAsync(MarkConversationReadCommand command, CancellationToken cancellationToken = default)
    {
        var conversation = await conversationRepository.GetConversationByIdAsync(command.ConversationId, cancellationToken)
            ?? throw new DomainException($"Conversation {command.ConversationId} not found.");

        var isParticipant = conversation.CustomerId == command.ReaderId || conversation.PhotographerId == command.ReaderId;
        if (!isParticipant)
            throw new DomainException("Reader is not a participant of this conversation.");

        return await conversationRepository.MarkMessagesAsReadAsync(command.ConversationId, command.ReaderId, DateTime.UtcNow, cancellationToken);
    }
}
