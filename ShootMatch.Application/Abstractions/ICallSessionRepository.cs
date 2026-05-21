using ShootMatch.Domain.Entities;

namespace ShootMatch.Application.Abstractions;

public interface ICallSessionRepository
{
    Task SaveAsync(CallSession session, CancellationToken cancellationToken = default);
    Task<CallSession?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<CallSession?> GetActiveByConversationIdAsync(Guid conversationId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CallSession>> GetByConversationIdAsync(Guid conversationId, CancellationToken cancellationToken = default);
    Task UpdateStatusAsync(Guid callSessionId, string status, DateTime? answeredAt = null, DateTime? endedAt = null, string? endReason = null, string? sessionToken = null, DateTime? lastSignalAt = null, CancellationToken cancellationToken = default);
}
