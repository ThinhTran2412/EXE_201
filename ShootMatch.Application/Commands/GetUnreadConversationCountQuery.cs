namespace ShootMatch.Application.Commands;

public sealed record GetUnreadConversationCountQuery(Guid ConversationId, Guid RecipientId);
