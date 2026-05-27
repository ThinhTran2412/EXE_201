using ShootMatch.Domain.Entities;

namespace ShootMatch.Application.Abstractions;

public interface IConversationRepository
{
    Task SaveConversationAsync(Conversation conversation, CancellationToken cancellationToken = default);
    Task<Conversation?> GetConversationByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Conversation?> GetConversationByMatchIdAsync(Guid matchId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Conversation>> GetConversationsByCustomerIdAsync(Guid customerId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Conversation>> GetConversationsByPhotographerIdAsync(Guid photographerId, CancellationToken cancellationToken = default);
    Task SaveMessageAsync(Message message, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Message>> GetMessagesAsync(Guid conversationId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Message>> GetUnreadMessagesAsync(Guid conversationId, Guid recipientId, CancellationToken cancellationToken = default);
    Task<int> MarkMessagesAsReadAsync(Guid conversationId, Guid readerId, DateTime readAt, CancellationToken cancellationToken = default);
    Task<int> GetUnreadCountAsync(Guid conversationId, Guid recipientId, CancellationToken cancellationToken = default);
    Task TouchLastMessageAtAsync(Guid conversationId, DateTime sentAt, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Message>> GetExpiredImageMessagesAsync(DateTime utcNow, int limit, CancellationToken cancellationToken = default);
    Task UpdateMessageMediaAsync(Message message, CancellationToken cancellationToken = default);
}
