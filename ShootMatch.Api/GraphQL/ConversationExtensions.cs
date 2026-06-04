using HotChocolate;
using HotChocolate.Types;
using Microsoft.EntityFrameworkCore;
using ShootMatch.Domain.Entities;
using ShootMatch.Infrastructure.Persistence;

namespace ShootMatch.Api.GraphQL;

[ExtendObjectType(typeof(Conversation))]
public sealed class ConversationExtensions
{
    public async Task<string?> GetCustomerDisplayName(
        [Parent] Conversation conversation,
        [Service] ShootMatchDbContext db,
        CancellationToken cancellationToken)
    {
        return await db.Customers.AsNoTracking()
            .Where(x => x.Id == conversation.CustomerId)
            .Select(x => x.DisplayName)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<string?> GetCustomerAvatarUrl(
        [Parent] Conversation conversation,
        [Service] ShootMatchDbContext db,
        CancellationToken cancellationToken)
    {
        return await db.Customers.AsNoTracking()
            .Where(x => x.Id == conversation.CustomerId)
            .Select(x => x.AvatarUrl)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<string?> GetPhotographerDisplayName(
        [Parent] Conversation conversation,
        [Service] ShootMatchDbContext db,
        CancellationToken cancellationToken)
    {
        return await db.Photographers.AsNoTracking()
            .Where(x => x.Id == conversation.PhotographerId)
            .Select(x => x.DisplayName)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<string?> GetPhotographerAvatarUrl(
        [Parent] Conversation conversation,
        [Service] ShootMatchDbContext db,
        CancellationToken cancellationToken)
    {
        return await db.Photographers.AsNoTracking()
            .Where(x => x.Id == conversation.PhotographerId)
            .Select(x => x.AvatarUrl)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<string?> GetLastMessageContent(
        [Parent] Conversation conversation,
        [Service] ShootMatchDbContext db,
        CancellationToken cancellationToken)
    {
        var lastMsg = await db.Messages.AsNoTracking()
            .Where(x => x.ConversationId == conversation.Id)
            .OrderByDescending(x => x.SentAt)
            .Select(x => new { x.Content, x.ContentType, x.SenderId, x.SenderRole })
            .FirstOrDefaultAsync(cancellationToken);

        if (lastMsg is null) return null;

        if (lastMsg.ContentType == "Image")
        {
            string senderName = "Đối phương";
            if (lastMsg.SenderRole == "customer")
            {
                senderName = await db.Customers.AsNoTracking()
                    .Where(x => x.Id == lastMsg.SenderId)
                    .Select(x => x.DisplayName)
                    .FirstOrDefaultAsync(cancellationToken) ?? "Khách hàng";
            }
            else if (lastMsg.SenderRole == "photographer")
            {
                senderName = await db.Photographers.AsNoTracking()
                    .Where(x => x.Id == lastMsg.SenderId)
                    .Select(x => x.DisplayName)
                    .FirstOrDefaultAsync(cancellationToken) ?? "Nhiếp ảnh gia";
            }
            return $"{senderName} đã gửi một ảnh";
        }

        return lastMsg.Content;
    }

    public async Task<string?> GetLastMessageSenderRole(
        [Parent] Conversation conversation,
        [Service] ShootMatchDbContext db,
        CancellationToken cancellationToken)
    {
        return await db.Messages.AsNoTracking()
            .Where(x => x.ConversationId == conversation.Id)
            .OrderByDescending(x => x.SentAt)
            .Select(x => x.SenderRole)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<string?> GetLastMessageSenderName(
        [Parent] Conversation conversation,
        [Service] ShootMatchDbContext db,
        CancellationToken cancellationToken)
    {
        var lastMessage = await db.Messages.AsNoTracking()
            .Where(x => x.ConversationId == conversation.Id)
            .OrderByDescending(x => x.SentAt)
            .Select(x => new { x.SenderId, x.SenderRole })
            .FirstOrDefaultAsync(cancellationToken);

        if (lastMessage is null) return null;

        if (lastMessage.SenderRole == "customer")
        {
            return await db.Customers.AsNoTracking()
                .Where(x => x.Id == lastMessage.SenderId)
                .Select(x => x.DisplayName)
                .FirstOrDefaultAsync(cancellationToken);
        }
        else if (lastMessage.SenderRole == "photographer")
        {
            return await db.Photographers.AsNoTracking()
                .Where(x => x.Id == lastMessage.SenderId)
                .Select(x => x.DisplayName)
                .FirstOrDefaultAsync(cancellationToken);
        }

        return null;
    }
}
