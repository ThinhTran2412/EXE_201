namespace ShootMatch.Api.Contracts;

public sealed record RecordSwipeRequest(
    Guid SearchSessionId,
    Guid PhotographerId,
    string Direction); // "Left" | "Right"
