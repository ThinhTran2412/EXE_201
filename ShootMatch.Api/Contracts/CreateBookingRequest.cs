namespace ShootMatch.Api.Contracts;

public sealed record CreateBookingRequest(
    Guid MatchId,
    Guid? ServicePackageId,
    decimal AgreedPrice,
    decimal Commission,
    DateTime ScheduledAt,
    string? Phone,
    string? Location,
    string? Note,
    string? Requirements);
