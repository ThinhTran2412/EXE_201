namespace ShootMatch.Application.Contracts;

public sealed class PhotographerMatchCard
{
    public required Guid PhotographerId { get; init; }
    public required string DisplayName { get; init; }
    public required string Region { get; init; }
    public required decimal MinBudget { get; init; }
    public required decimal MaxBudget { get; init; }
    public required double Rating { get; init; }
    public required bool IsPremium { get; init; }
    public required string AvatarUrl { get; init; }
    public required double SimilarityScore { get; init; }
    public required double FinalScore { get; init; }
    public double? CurrentLatitude { get; init; }
    public double? CurrentLongitude { get; init; }
    public IReadOnlyList<string> PortfolioPhotos { get; init; } = [];
}
