using ShootMatch.Domain.Entities;

namespace ShootMatch.Application.Abstractions;

public interface IConversationRepository
{
    // ── Conversation ──────────────────────────────────────────────────────────
    Task SaveConversationAsync(Conversation conversation, CancellationToken cancellationToken = default);
    Task<Conversation?> GetConversationByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Conversation?> GetConversationByMatchIdAsync(Guid matchId, CancellationToken cancellationToken = default);

    /// <summary>All conversations for a customer (Active first).</summary>
    Task<IReadOnlyList<Conversation>> GetConversationsByCustomerIdAsync(Guid customerId, CancellationToken cancellationToken = default);

    /// <summary>All conversations for a photographer (Active first).</summary>
    Task<IReadOnlyList<Conversation>> GetConversationsByPhotographerIdAsync(Guid photographerId, CancellationToken cancellationToken = default);

    // ── Messages ─────────────────────────────────────────────────────────────
    Task SaveMessageAsync(Message message, CancellationToken cancellationToken = default);

    /// <summary>Returns messages ordered by SentAt ascending (oldest first).</summary>
    Task<IReadOnlyList<Message>> GetMessagesAsync(Guid conversationId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates LastMessageAt on the Conversation.
    /// Called after every new message to keep the inbox sorted.
    /// </summary>
    Task TouchLastMessageAtAsync(Guid conversationId, DateTime sentAt, CancellationToken cancellationToken = default);
}
