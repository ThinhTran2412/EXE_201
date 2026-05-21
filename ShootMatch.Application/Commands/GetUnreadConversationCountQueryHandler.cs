using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Exceptions;

namespace ShootMatch.Application.Commands;

public sealed class GetUnreadConversationCountQueryHandler(IConversationRepository conversationRepository)
{
    public async Task<int> HandleAsync(GetUnreadConversationCountQuery query, CancellationToken cancellationToken = default)
    {
        var conversation = await conversationRepository.GetConversationByIdAsync(query.ConversationId, cancellationToken)
            ?? throw new DomainException($"Conversation {query.ConversationId} not found.");

        if (conversation.CustomerId != query.RecipientId && conversation.PhotographerId != query.RecipientId)
            throw new DomainException("Recipient is not a participant of this conversation.");

        return await conversationRepository.GetUnreadCountAsync(query.ConversationId, query.RecipientId, cancellationToken);
    }
}
