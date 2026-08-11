using HotChocolate;
using HotChocolate.Types;
using ShootMatch.Domain.Entities;

namespace ShootMatch.Api.GraphQL;

[ExtendObjectType(typeof(Conversation))]
public sealed class ConversationExtensions
{
    public async Task<string?> GetCustomerDisplayName(
        [Parent] Conversation conversation,
        CustomerDataLoader customerLoader,
        CancellationToken cancellationToken)
    {
        var customer = await customerLoader.LoadAsync(conversation.CustomerId, cancellationToken);
        return customer?.DisplayName;
    }

    public async Task<string?> GetCustomerAvatarUrl(
        [Parent] Conversation conversation,
        CustomerDataLoader customerLoader,
        CancellationToken cancellationToken)
    {
        var customer = await customerLoader.LoadAsync(conversation.CustomerId, cancellationToken);
        return customer?.AvatarUrl;
    }

    public async Task<string?> GetPhotographerDisplayName(
        [Parent] Conversation conversation,
        PhotographerDataLoader photographerLoader,
        CancellationToken cancellationToken)
    {
        var photographer = await photographerLoader.LoadAsync(conversation.PhotographerId, cancellationToken);
        return photographer?.DisplayName;
    }

    public async Task<string?> GetPhotographerAvatarUrl(
        [Parent] Conversation conversation,
        PhotographerDataLoader photographerLoader,
        CancellationToken cancellationToken)
    {
        var photographer = await photographerLoader.LoadAsync(conversation.PhotographerId, cancellationToken);
        return photographer?.AvatarUrl;
    }

    public async Task<string?> GetLastMessageContent(
        [Parent] Conversation conversation,
        LastMessageDataLoader lastMessageLoader,
        CustomerDataLoader customerLoader,
        PhotographerDataLoader photographerLoader,
        CancellationToken cancellationToken)
    {
        var lastMsg = await lastMessageLoader.LoadAsync(conversation.Id, cancellationToken);
        if (lastMsg is null) return null;

        if (lastMsg.ContentType == "Image")
        {
            string senderName = "Đối phương";
            if (lastMsg.SenderRole == "customer")
            {
                var customer = await customerLoader.LoadAsync(lastMsg.SenderId, cancellationToken);
                senderName = customer?.DisplayName ?? "Khách hàng";
            }
            else if (lastMsg.SenderRole == "photographer")
            {
                var photographer = await photographerLoader.LoadAsync(lastMsg.SenderId, cancellationToken);
                senderName = photographer?.DisplayName ?? "Nhiếp ảnh gia";
            }
            return $"{senderName} đã gửi một ảnh";
        }

        return lastMsg.Content;
    }

    public async Task<string?> GetLastMessageSenderRole(
        [Parent] Conversation conversation,
        LastMessageDataLoader lastMessageLoader,
        CancellationToken cancellationToken)
    {
        var lastMsg = await lastMessageLoader.LoadAsync(conversation.Id, cancellationToken);
        return lastMsg?.SenderRole;
    }

    public async Task<string?> GetLastMessageSenderName(
        [Parent] Conversation conversation,
        LastMessageDataLoader lastMessageLoader,
        CustomerDataLoader customerLoader,
        PhotographerDataLoader photographerLoader,
        CancellationToken cancellationToken)
    {
        var lastMessage = await lastMessageLoader.LoadAsync(conversation.Id, cancellationToken);
        if (lastMessage is null) return null;

        if (lastMessage.SenderRole == "customer")
        {
            var customer = await customerLoader.LoadAsync(lastMessage.SenderId, cancellationToken);
            return customer?.DisplayName;
        }
        else if (lastMessage.SenderRole == "photographer")
        {
            var photographer = await photographerLoader.LoadAsync(lastMessage.SenderId, cancellationToken);
            return photographer?.DisplayName;
        }

        return null;
    }
}
