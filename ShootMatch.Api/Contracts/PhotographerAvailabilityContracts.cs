namespace ShootMatch.Api.Contracts;

public sealed record BlockPhotographerAvailabilityRequest(
    DateOnly SpecificDate,
    TimeOnly StartTime,
    TimeOnly EndTime);

public sealed record BlockPhotographerAvailabilityBatchRequest(
    DateOnly SpecificDate,
    IReadOnlyList<BlockPhotographerAvailabilityRequest> Slots);
