using Microsoft.EntityFrameworkCore;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;
using ShootMatch.Infrastructure.Persistence.Entities;

namespace ShootMatch.Infrastructure.Persistence;

public sealed class EfConversationRepository(ShootMatchDbContext db) : IConversationRepository
{
    public async Task SaveConversationAsync(Conversation conversation, CancellationToken cancellationToken = default)
    {
        var existing = await db.Conversations.FirstOrDefaultAsync(x => x.Id == conversation.Id, cancellationToken);
        if (existing is null)
        {
            await db.Conversations.AddAsync(new ConversationRecord
            {
                Id = conversation.Id,
                MatchId = conversation.MatchId,
                CustomerId = conversation.CustomerId,
                PhotographerId = conversation.PhotographerId,
                Status = conversation.Status,
                CreatedAt = conversation.CreatedAt,
                LastMessageAt = conversation.LastMessageAt
            }, cancellationToken);
        }
        else
        {
            existing.Status = conversation.Status;
            existing.LastMessageAt = conversation.LastMessageAt;
        }
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<Conversation?> GetConversationByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var r = await db.Conversations.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        return r is null ? null : ToEntity(r);
    }

    public async Task<Conversation?> GetConversationByMatchIdAsync(Guid matchId, CancellationToken cancellationToken = default)
    {
        var r = await db.Conversations.AsNoTracking().FirstOrDefaultAsync(x => x.MatchId == matchId, cancellationToken);
        return r is null ? null : ToEntity(r);
    }

    public async Task<IReadOnlyList<Conversation>> GetConversationsByCustomerIdAsync(Guid customerId, CancellationToken cancellationToken = default)
    {
        var rows = await (
            from c in db.Conversations.AsNoTracking()
            where c.CustomerId == customerId
            join p in db.Photographers.AsNoTracking() on c.PhotographerId equals p.Id into photographers
            from p in photographers.DefaultIfEmpty()
            join lastMessage in db.Messages.AsNoTracking()
                .OrderByDescending(m => m.SentAt)
                on c.Id equals lastMessage.ConversationId into messages
            from lastMessage in messages.Take(1).DefaultIfEmpty()
            orderby (c.LastMessageAt ?? c.CreatedAt) descending
            select new { Conversation = c, Photographer = p, LastMessage = lastMessage }
        ).ToListAsync(cancellationToken);

        return rows.Select(x => ToEntity(
            x.Conversation,
            lastMessageContent: GetPreviewText(x.LastMessage, x.LastMessage?.SenderRole == "customer" ? "Bạn" : x.Photographer?.DisplayName),
            lastMessageSenderName: x.LastMessage?.SenderRole == "customer" ? "Bạn" : x.Photographer?.DisplayName,
            lastMessageSenderRole: x.LastMessage?.SenderRole,
            unreadCount: 0,
            customerDisplayName: null,
            photographerDisplayName: x.Photographer?.DisplayName,
            customerAvatarUrl: null,
            photographerAvatarUrl: x.Photographer?.AvatarUrl)).ToList();
    }

    public async Task<IReadOnlyList<Conversation>> GetConversationsByPhotographerIdAsync(Guid photographerId, CancellationToken cancellationToken = default)
    {
        var rows = await (
            from c in db.Conversations.AsNoTracking()
            where c.PhotographerId == photographerId
            join cust in db.Customers.AsNoTracking() on c.CustomerId equals cust.Id into customers
            from cust in customers.DefaultIfEmpty()
            join lastMessage in db.Messages.AsNoTracking()
                .OrderByDescending(m => m.SentAt)
                on c.Id equals lastMessage.ConversationId into messages
            from lastMessage in messages.Take(1).DefaultIfEmpty()
            orderby (c.LastMessageAt ?? c.CreatedAt) descending
            select new { Conversation = c, Customer = cust, LastMessage = lastMessage }
        ).ToListAsync(cancellationToken);

        return rows.Select(x => ToEntity(
            x.Conversation,
            lastMessageContent: GetPreviewText(x.LastMessage, x.LastMessage?.SenderRole == "photographer" ? "Bạn" : x.Customer?.DisplayName),
            lastMessageSenderName: x.LastMessage?.SenderRole == "photographer" ? "Bạn" : x.Customer?.DisplayName,
            lastMessageSenderRole: x.LastMessage?.SenderRole,
            unreadCount: 0,
            customerDisplayName: x.Customer?.DisplayName,
            photographerDisplayName: null,
            customerAvatarUrl: x.Customer?.AvatarUrl,
            photographerAvatarUrl: null,
            customerLastSeenAt: x.Customer?.LastSeenAt)).ToList();
    }

    public async Task SaveMessageAsync(Message message, CancellationToken cancellationToken = default)
    {
        await db.Messages.AddAsync(new MessageRecord
        {
            Id = message.Id,
            ConversationId = message.ConversationId,
            SenderId = message.SenderId,
            SenderRole = message.SenderRole,
            Content = message.Content,
            ContentType = message.ContentType,
            MediaPreviewUrl = message.MediaPreviewUrl,
            MediaExpiresAt = message.MediaExpiresAt,
            MediaDowngraded = message.MediaDowngraded,
            SentAt = message.SentAt,
            ReadAt = message.ReadAt
        }, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Message>> GetMessagesAsync(Guid conversationId, CancellationToken cancellationToken = default)
        => (await db.Messages.AsNoTracking().Where(x => x.ConversationId == conversationId).OrderBy(x => x.SentAt).ToListAsync(cancellationToken)).Select(ToEntity).ToList();

    public async Task<IReadOnlyList<Message>> GetUnreadMessagesAsync(Guid conversationId, Guid recipientId, CancellationToken cancellationToken = default)
        => (await db.Messages.AsNoTracking().Where(x => x.ConversationId == conversationId && x.SenderId != recipientId && x.ReadAt == null).OrderBy(x => x.SentAt).ToListAsync(cancellationToken)).Select(ToEntity).ToList();

    public async Task<int> MarkMessagesAsReadAsync(Guid conversationId, Guid readerId, DateTime readAt, CancellationToken cancellationToken = default)
    {
        var messages = await db.Messages.Where(x => x.ConversationId == conversationId && x.SenderId != readerId && x.ReadAt == null).ToListAsync(cancellationToken);
        foreach (var message in messages) message.ReadAt = readAt;
        await db.SaveChangesAsync(cancellationToken);
        return messages.Count;
    }

    public async Task<int> GetUnreadCountAsync(Guid conversationId, Guid recipientId, CancellationToken cancellationToken = default)
        => await db.Messages.CountAsync(x => x.ConversationId == conversationId && x.SenderId != recipientId && x.ReadAt == null, cancellationToken);

    public async Task TouchLastMessageAtAsync(Guid conversationId, DateTime sentAt, CancellationToken cancellationToken = default)
    {
        var conv = await db.Conversations.FirstOrDefaultAsync(x => x.Id == conversationId, cancellationToken);
        if (conv is null) return;
        conv.LastMessageAt = sentAt;
        await db.SaveChangesAsync(cancellationToken);
    }

    private static string? GetPreviewText(MessageRecord? message, string? senderName)
        => message is null
            ? null
            : message.ContentType == "Image"
                ? $"{senderName ?? "Người đối diện"} đã gửi một ảnh"
                : message.Content;

    private static Conversation ToEntity(
        ConversationRecord r,
        string? lastMessageContent = null,
        string? lastMessageSenderRole = null,
        string? lastMessageSenderName = null,
        int unreadCount = 0,
        string? customerDisplayName = null,
        string? photographerDisplayName = null,
        string? customerAvatarUrl = null,
        string? photographerAvatarUrl = null,
        DateTime? customerLastSeenAt = null) => new()
    {
        Id = r.Id,
        MatchId = r.MatchId,
        CustomerId = r.CustomerId,
        PhotographerId = r.PhotographerId,
        Status = r.Status,
        CreatedAt = r.CreatedAt,
        LastMessageAt = r.LastMessageAt,
        LastMessageContent = lastMessageContent,
        LastMessageSenderRole = lastMessageSenderRole,
        LastMessageSenderName = lastMessageSenderName,
        UnreadCount = unreadCount,
        CustomerDisplayName = customerDisplayName,
        PhotographerDisplayName = photographerDisplayName,
        CustomerAvatarUrl = customerAvatarUrl,
        PhotographerAvatarUrl = photographerAvatarUrl,
        CustomerLastSeenAt = customerLastSeenAt,
    };

    public async Task<IReadOnlyList<Message>> GetExpiredImageMessagesAsync(DateTime utcNow, int limit, CancellationToken cancellationToken = default)
        => (await db.Messages
            .Where(x => x.ContentType == "Image"
                && !x.MediaDowngraded
                && x.MediaExpiresAt != null
                && x.MediaExpiresAt <= utcNow
                && x.MediaPreviewUrl != null)
            .OrderBy(x => x.MediaExpiresAt)
            .Take(limit)
            .ToListAsync(cancellationToken))
            .Select(ToEntity)
            .ToList();

    public async Task UpdateMessageMediaAsync(Message message, CancellationToken cancellationToken = default)
    {
        var row = await db.Messages.FirstOrDefaultAsync(x => x.Id == message.Id, cancellationToken);
        if (row is null) return;
        row.Content = message.Content;
        row.MediaPreviewUrl = message.MediaPreviewUrl;
        row.MediaExpiresAt = message.MediaExpiresAt;
        row.MediaDowngraded = message.MediaDowngraded;
        await db.SaveChangesAsync(cancellationToken);
    }

    private static Message ToEntity(MessageRecord m) => new()
    {
        Id = m.Id,
        ConversationId = m.ConversationId,
        SenderId = m.SenderId,
        SenderRole = m.SenderRole,
        Content = m.Content,
        ContentType = m.ContentType,
        MediaPreviewUrl = m.MediaPreviewUrl,
        MediaExpiresAt = m.MediaExpiresAt,
        MediaDowngraded = m.MediaDowngraded,
        SentAt = m.SentAt,
        ReadAt = m.ReadAt
    };
}
