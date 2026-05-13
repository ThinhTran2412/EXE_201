using Microsoft.EntityFrameworkCore;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;
using ShootMatch.Infrastructure.Persistence.Entities;

namespace ShootMatch.Infrastructure.Persistence;

public sealed class EfConversationRepository(ShootMatchDbContext db) : IConversationRepository
{
    // ── Conversation ─────────────────────────────────────────────────────────

    public async Task SaveConversationAsync(Conversation conversation, CancellationToken cancellationToken = default)
    {
        var existing = await db.Conversations.FirstOrDefaultAsync(x => x.Id == conversation.Id, cancellationToken);
        if (existing is null)
        {
            await db.Conversations.AddAsync(new ConversationRecord
            {
                Id             = conversation.Id,
                MatchId        = conversation.MatchId,
                CustomerId     = conversation.CustomerId,
                PhotographerId = conversation.PhotographerId,
                Status         = conversation.Status,
                CreatedAt      = conversation.CreatedAt,
                LastMessageAt  = conversation.LastMessageAt
            }, cancellationToken);
        }
        else
        {
            existing.Status        = conversation.Status;
            existing.LastMessageAt = conversation.LastMessageAt;
        }
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<Conversation?> GetConversationByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var r = await db.Conversations.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        return r is null ? null : ToEntity(r);
    }

    public async Task<Conversation?> GetConversationByMatchIdAsync(Guid matchId, CancellationToken cancellationToken = default)
    {
        var r = await db.Conversations.AsNoTracking()
            .FirstOrDefaultAsync(x => x.MatchId == matchId, cancellationToken);
        return r is null ? null : ToEntity(r);
    }

    public async Task<IReadOnlyList<Conversation>> GetConversationsByCustomerIdAsync(Guid customerId, CancellationToken cancellationToken = default)
    {
        var records = await db.Conversations.AsNoTracking()
            .Where(x => x.CustomerId == customerId)
            .OrderByDescending(x => x.LastMessageAt ?? x.CreatedAt)
            .ToListAsync(cancellationToken);
        return records.Select(ToEntity).ToList();
    }

    public async Task<IReadOnlyList<Conversation>> GetConversationsByPhotographerIdAsync(Guid photographerId, CancellationToken cancellationToken = default)
    {
        var records = await db.Conversations.AsNoTracking()
            .Where(x => x.PhotographerId == photographerId)
            .OrderByDescending(x => x.LastMessageAt ?? x.CreatedAt)
            .ToListAsync(cancellationToken);
        return records.Select(ToEntity).ToList();
    }

    // ── Messages ─────────────────────────────────────────────────────────────

    public async Task SaveMessageAsync(Message message, CancellationToken cancellationToken = default)
    {
        await db.Messages.AddAsync(new MessageRecord
        {
            Id             = message.Id,
            ConversationId = message.ConversationId,
            SenderId       = message.SenderId,
            SenderRole     = message.SenderRole,
            Content        = message.Content,
            ContentType    = message.ContentType,
            SentAt         = message.SentAt,
            ReadAt         = message.ReadAt
        }, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Message>> GetMessagesAsync(Guid conversationId, CancellationToken cancellationToken = default)
    {
        var records = await db.Messages.AsNoTracking()
            .Where(x => x.ConversationId == conversationId)
            .OrderBy(x => x.SentAt)
            .ToListAsync(cancellationToken);
        return records.Select(m => new Message
        {
            Id             = m.Id,
            ConversationId = m.ConversationId,
            SenderId       = m.SenderId,
            SenderRole     = m.SenderRole,
            Content        = m.Content,
            ContentType    = m.ContentType,
            SentAt         = m.SentAt,
            ReadAt         = m.ReadAt
        }).ToList();
    }

    public async Task TouchLastMessageAtAsync(Guid conversationId, DateTime sentAt, CancellationToken cancellationToken = default)
    {
        var conv = await db.Conversations.FirstOrDefaultAsync(x => x.Id == conversationId, cancellationToken);
        if (conv is null) return;
        conv.LastMessageAt = sentAt;
        await db.SaveChangesAsync(cancellationToken);
    }

    private static Conversation ToEntity(ConversationRecord r) => new()
    {
        Id             = r.Id,
        MatchId        = r.MatchId,
        CustomerId     = r.CustomerId,
        PhotographerId = r.PhotographerId,
        Status         = r.Status,
        CreatedAt      = r.CreatedAt,
        LastMessageAt  = r.LastMessageAt
    };
}
