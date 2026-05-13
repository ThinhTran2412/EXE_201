namespace ShootMatch.Application.Commands;

public sealed record CreateBookingCommand(
    Guid CustomerId,
    Guid MatchId,
    Guid? ServicePackageId,
    decimal AgreedPrice,
    decimal CommissionRate,    // e.g. 0.10 = 10%
    DateTime ScheduledAt);
