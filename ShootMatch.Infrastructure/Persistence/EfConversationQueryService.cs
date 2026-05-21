using Microsoft.EntityFrameworkCore;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;

namespace ShootMatch.Infrastructure.Persistence;

public sealed class EfConversationQueryService(ShootMatchDbContext db) : IConversationQueryService
{
    public async Task<IReadOnlyList<ConversationSummaryDto>> GetInboxAsync(Guid userId, string role, CancellationToken cancellationToken = default)
    {
        var query = db.Conversations.AsNoTracking().AsQueryable();
        query = role == "customer" ? query.Where(x => x.CustomerId == userId) : query.Where(x => x.PhotographerId == userId);

        var conversations = await query.OrderByDescending(x => x.LastMessageAt ?? x.CreatedAt).ToListAsync(cancellationToken);
        var result = new List<ConversationSummaryDto>();
        foreach (var c in conversations)
        {
            var unread = await db.Messages.CountAsync(x => x.ConversationId == c.Id && x.SenderId != userId && x.ReadAt == null, cancellationToken);
            var lastCall = await db.CallSessions.AsNoTracking().Where(x => x.ConversationId == c.Id).OrderByDescending(x => x.StartedAt).FirstOrDefaultAsync(cancellationToken);
            result.Add(new ConversationSummaryDto(c.Id, c.MatchId, c.CustomerId, c.PhotographerId, c.Status, c.CreatedAt, c.LastMessageAt, unread, lastCall?.StartedAt, lastCall?.Status, lastCall?.CallType));
        }
        return result;
    }

    public async Task<IReadOnlyList<Message>> GetMessagesAsync(Guid conversationId, Guid requesterId, CancellationToken cancellationToken = default)
    {
        var conversation = await db.Conversations.AsNoTracking().FirstOrDefaultAsync(x => x.Id == conversationId, cancellationToken);
        if (conversation is null || (conversation.CustomerId != requesterId && conversation.PhotographerId != requesterId)) return [];
        return await db.Messages.AsNoTracking().Where(x => x.ConversationId == conversationId).OrderBy(x => x.SentAt).Select(x => new Message
        {
            Id = x.Id,
            ConversationId = x.ConversationId,
            SenderId = x.SenderId,
            SenderRole = x.SenderRole,
            Content = x.Content,
            ContentType = x.ContentType,
            SentAt = x.SentAt,
            ReadAt = x.ReadAt
        }).ToListAsync(cancellationToken);
    }
}
