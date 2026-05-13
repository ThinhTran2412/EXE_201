namespace ShootMatch.Application.Contracts;

public sealed class MatchSearchRequest
{
    public required Guid CustomerId { get; init; }
    public required IReadOnlyList<string> ReferenceImageUrls { get; init; }
    public string? Region { get; init; }
    public decimal? Budget { get; init; }
    public int TopK { get; init; } = 20;
}
