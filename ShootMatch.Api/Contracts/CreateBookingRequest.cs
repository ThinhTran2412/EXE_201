namespace ShootMatch.Api.Contracts;

public sealed record CreateBookingRequest(
    Guid MatchId,
    Guid? ServicePackageId,
    decimal AgreedPrice,
    DateTime ScheduledAt);
