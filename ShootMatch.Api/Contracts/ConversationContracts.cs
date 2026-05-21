namespace ShootMatch.Api.Contracts;

public sealed record GetConversationMessagesRequest(int Page = 1, int PageSize = 50);
public sealed record InboxRequest(int Page = 1, int PageSize = 50);
public sealed record MarkConversationReadRequest(Guid ConversationId);
