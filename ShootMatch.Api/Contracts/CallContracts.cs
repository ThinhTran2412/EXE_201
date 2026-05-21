namespace ShootMatch.Api.Contracts;

public sealed record StartCallRequest(Guid ConversationId, string CallType, string? SessionToken = null);
public sealed record UpdateCallRequest(string Status, string? EndReason = null, string? SessionToken = null);
public sealed record SendCallSignalRequest(Guid ConversationId, Guid? CallSessionId, string SignalType, string PayloadJson);
