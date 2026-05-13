namespace ShootMatch.Api.Contracts;

public sealed record SubmitReviewRequest(
    Guid BookingId,
    int Rating,       // 1-5
    string Comment);
