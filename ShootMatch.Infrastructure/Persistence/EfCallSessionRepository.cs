using Microsoft.EntityFrameworkCore;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;
using ShootMatch.Infrastructure.Persistence.Entities;

namespace ShootMatch.Infrastructure.Persistence;

public sealed class EfCallSessionRepository(ShootMatchDbContext db) : ICallSessionRepository
{
    public async Task SaveAsync(CallSession session, CancellationToken cancellationToken = default)
    {
        await db.CallSessions.AddAsync(ToRecord(session), cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<CallSession?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => ToEntity(await db.CallSessions.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken));

    public async Task<CallSession?> GetActiveByConversationIdAsync(Guid conversationId, CancellationToken cancellationToken = default)
        => ToEntity(await db.CallSessions.AsNoTracking().Where(x => x.ConversationId == conversationId && (x.Status == "ringing" || x.Status == "active")).OrderByDescending(x => x.StartedAt).FirstOrDefaultAsync(cancellationToken));

    public async Task<IReadOnlyList<CallSession>> GetByConversationIdAsync(Guid conversationId, CancellationToken cancellationToken = default)
        => (await db.CallSessions.AsNoTracking().Where(x => x.ConversationId == conversationId).OrderByDescending(x => x.StartedAt).ToListAsync(cancellationToken)).Select(ToEntity).Where(x => x is not null).Cast<CallSession>().ToList();

    public async Task UpdateStatusAsync(Guid callSessionId, string status, DateTime? answeredAt = null, DateTime? endedAt = null, string? endReason = null, string? sessionToken = null, DateTime? lastSignalAt = null, CancellationToken cancellationToken = default)
    {
        var record = await db.CallSessions.FirstOrDefaultAsync(x => x.Id == callSessionId, cancellationToken);
        if (record is null) return;
        record.Status = status;
        record.AnsweredAt = answeredAt ?? record.AnsweredAt;
        record.EndedAt = endedAt ?? record.EndedAt;
        record.EndReason = endReason ?? record.EndReason;
        record.SessionToken = sessionToken ?? record.SessionToken;
        record.LastSignalAt = lastSignalAt ?? record.LastSignalAt;
        await db.SaveChangesAsync(cancellationToken);
    }

    private static CallSessionRecord ToRecord(CallSession session) => new()
    {
        Id = session.Id,
        ConversationId = session.ConversationId,
        CallType = session.CallType,
        Status = session.Status,
        InitiatorId = session.InitiatorId,
        InitiatorRole = session.InitiatorRole,
        StartedAt = session.StartedAt,
        AnsweredAt = session.AnsweredAt,
        EndedAt = session.EndedAt,
        EndReason = session.EndReason,
        SessionToken = session.SessionToken,
        LastSignalAt = session.LastSignalAt
    };

    private static CallSession? ToEntity(CallSessionRecord? record)
        => record is null ? null : new CallSession
        {
            Id = record.Id,
            ConversationId = record.ConversationId,
            CallType = record.CallType,
            Status = record.Status,
            InitiatorId = record.InitiatorId,
            InitiatorRole = record.InitiatorRole,
            StartedAt = record.StartedAt,
            AnsweredAt = record.AnsweredAt,
            EndedAt = record.EndedAt,
            EndReason = record.EndReason,
            SessionToken = record.SessionToken,
            LastSignalAt = record.LastSignalAt
        };
}
