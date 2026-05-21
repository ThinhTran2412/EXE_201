namespace ShootMatch.Application.Commands;

public sealed record MarkConversationReadCommand(Guid ConversationId, Guid ReaderId, string ReaderRole);
