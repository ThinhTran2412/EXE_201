namespace ShootMatch.Application.Commands;

public sealed record UpdateCallSessionCommand(
    Guid CallSessionId,
    string Status,
    Guid ActorId,
    string ActorRole,
    DateTime? AnsweredAt = null,
    DateTime? EndedAt = null,
    string? EndReason = null,
    string? SessionToken = null);
