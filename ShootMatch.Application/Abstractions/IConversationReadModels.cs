namespace ShootMatch.Application.Abstractions;

public sealed record ConversationSummaryDto(
    Guid ConversationId,
    Guid MatchId,
    Guid CustomerId,
    Guid PhotographerId,
    string Status,
    DateTime CreatedAt,
    DateTime? LastMessageAt,
    int UnreadCount,
    DateTime? LastCallAt,
    string? LastCallStatus,
    string? LastCallType);
