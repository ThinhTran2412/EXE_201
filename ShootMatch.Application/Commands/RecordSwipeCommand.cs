namespace ShootMatch.Application.Commands;

public sealed record RecordSwipeCommand(
    Guid CustomerId,
    Guid SearchSessionId,
    Guid PhotographerId,
    string Direction); // "Left" | "Right"
