namespace ShootMatch.Application.Contracts;

public sealed class MatchSearchResult
{
    public required Guid SearchId { get; init; }
    public required Guid CustomerId { get; init; }
    public required int InputImageCount { get; init; }
    public required IReadOnlyList<PhotographerMatchCard> RankedResults { get; init; }
}
