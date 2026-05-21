using ShootMatch.Domain.Entities;

namespace ShootMatch.Application.Abstractions;

public interface IConversationQueryService
{
    Task<IReadOnlyList<ConversationSummaryDto>> GetInboxAsync(Guid userId, string role, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Message>> GetMessagesAsync(Guid conversationId, Guid requesterId, CancellationToken cancellationToken = default);
}
