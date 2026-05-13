using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;
using ShootMatch.Domain.Exceptions;

namespace ShootMatch.Application.Commands;

/// <summary>
/// Persists a new Message and updates Conversation.LastMessageAt.
/// Returns the saved Message for broadcasting via SignalR.
/// 
/// Invariants enforced:
///  - Conversation must exist and be Active.
///  - Sender must be a participant (CustomerId or PhotographerId).
/// </summary>
public sealed class SendMessageCommandHandler(IConversationRepository conversationRepository)
{
    public async Task<Message> HandleAsync(
        SendMessageCommand command,
        CancellationToken cancellationToken = default)
    {
        var conversation = await conversationRepository.GetConversationByIdAsync(
            command.ConversationId, cancellationToken)
            ?? throw new DomainException($"Conversation {command.ConversationId} not found.");

        if (conversation.Status != "Active")
            throw new DomainException("Cannot send messages to a non-Active conversation.");

        // Participant check
        var isParticipant = conversation.CustomerId    == command.SenderId
                         || conversation.PhotographerId == command.SenderId;
        if (!isParticipant)
            throw new DomainException("Sender is not a participant of this conversation.");

        var message = new Message
        {
            Id             = Guid.NewGuid(),
            ConversationId = command.ConversationId,
            SenderId       = command.SenderId,
            SenderRole     = command.SenderRole,
            Content        = command.Content,
            ContentType    = command.ContentType,
            SentAt         = DateTime.UtcNow
        };

        await conversationRepository.SaveMessageAsync(message, cancellationToken);
        await conversationRepository.TouchLastMessageAtAsync(
            command.ConversationId, message.SentAt, cancellationToken);

        return message;
    }
}
