using System.Collections.Concurrent;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;

namespace ShootMatch.Infrastructure.Persistence;

public sealed class InMemoryConversationRepository : IConversationRepository
{
    private readonly ConcurrentDictionary<Guid, Conversation> _conversations = new();
    private readonly ConcurrentDictionary<Guid, Message> _messages = new();

    public Task SaveConversationAsync(Conversation conversation, CancellationToken cancellationToken = default)
    {
        _conversations[conversation.Id] = conversation;
        return Task.CompletedTask;
    }

    public Task<Conversation?> GetConversationByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        _conversations.TryGetValue(id, out var c);
        return Task.FromResult(c);
    }

    public Task<Conversation?> GetConversationByMatchIdAsync(Guid matchId, CancellationToken cancellationToken = default)
    {
        var c = _conversations.Values.FirstOrDefault(x => x.MatchId == matchId);
        return Task.FromResult(c);
    }

    public Task<IReadOnlyList<Conversation>> GetConversationsByCustomerIdAsync(Guid customerId, CancellationToken cancellationToken = default)
    {
        var result = (IReadOnlyList<Conversation>)_conversations.Values
            .Where(c => c.CustomerId == customerId)
            .OrderByDescending(c => c.LastMessageAt ?? c.CreatedAt)
            .ToList();
        return Task.FromResult(result);
    }

    public Task<IReadOnlyList<Conversation>> GetConversationsByPhotographerIdAsync(Guid photographerId, CancellationToken cancellationToken = default)
    {
        var result = (IReadOnlyList<Conversation>)_conversations.Values
            .Where(c => c.PhotographerId == photographerId)
            .OrderByDescending(c => c.LastMessageAt ?? c.CreatedAt)
            .ToList();
        return Task.FromResult(result);
    }

    public Task SaveMessageAsync(Message message, CancellationToken cancellationToken = default)
    {
        _messages[message.Id] = message;
        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<Message>> GetMessagesAsync(Guid conversationId, CancellationToken cancellationToken = default)
    {
        var result = (IReadOnlyList<Message>)_messages.Values
            .Where(m => m.ConversationId == conversationId)
            .OrderBy(m => m.SentAt)
            .ToList();
        return Task.FromResult(result);
    }

    public Task<IReadOnlyList<Message>> GetUnreadMessagesAsync(Guid conversationId, Guid recipientId, CancellationToken cancellationToken = default)
    {
        var result = (IReadOnlyList<Message>)_messages.Values
            .Where(m => m.ConversationId == conversationId && m.SenderId != recipientId && m.ReadAt is null)
            .OrderBy(m => m.SentAt)
            .ToList();
        return Task.FromResult(result);
    }

    public Task<int> MarkMessagesAsReadAsync(Guid conversationId, Guid readerId, DateTime readAt, CancellationToken cancellationToken = default)
    {
        var updated = 0;
        foreach (var message in _messages.Values.Where(m => m.ConversationId == conversationId && m.SenderId != readerId && m.ReadAt is null).ToList())
        {
            _messages[message.Id] = new Message
            {
                Id = message.Id,
                ConversationId = message.ConversationId,
                SenderId = message.SenderId,
                SenderRole = message.SenderRole,
                Content = message.Content,
                ContentType = message.ContentType,
                SentAt = message.SentAt,
                ReadAt = readAt
            };
            updated++;
        }

        return Task.FromResult(updated);
    }

    public Task<int> GetUnreadCountAsync(Guid conversationId, Guid recipientId, CancellationToken cancellationToken = default)
    {
        var count = _messages.Values.Count(m => m.ConversationId == conversationId && m.SenderId != recipientId && m.ReadAt is null);
        return Task.FromResult(count);
    }

    public Task TouchLastMessageAtAsync(Guid conversationId, DateTime sentAt, CancellationToken cancellationToken = default)
    {
        if (!_conversations.TryGetValue(conversationId, out var existing)) return Task.CompletedTask;

        _conversations[conversationId] = new Conversation
        {
            Id = existing.Id,
            MatchId = existing.MatchId,
            CustomerId = existing.CustomerId,
            PhotographerId = existing.PhotographerId,
            Status = existing.Status,
            CreatedAt = existing.CreatedAt,
            LastMessageAt = sentAt
        };
        return Task.CompletedTask;
    }
}
