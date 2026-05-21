namespace ShootMatch.Application.Commands;

public sealed record InitiateCallCommand(
    Guid ConversationId,
    Guid InitiatorId,
    string InitiatorRole,
    string CallType,
    string? SessionToken = null);
