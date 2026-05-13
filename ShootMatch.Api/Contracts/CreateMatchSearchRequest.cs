namespace ShootMatch.Api.Contracts;

public sealed class CreateMatchSearchRequest
{
    public required IReadOnlyList<string> ReferenceImageUrls { get; init; }
    public string? Region { get; init; }
    public decimal? Budget { get; init; }
    public int TopK { get; init; } = 20;
}
