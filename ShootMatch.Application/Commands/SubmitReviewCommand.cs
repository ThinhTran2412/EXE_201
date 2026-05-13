namespace ShootMatch.Application.Commands;

public sealed record SubmitReviewCommand(
    Guid CustomerId,
    Guid BookingId,
    int Rating,          // 1-5
    string Comment);
