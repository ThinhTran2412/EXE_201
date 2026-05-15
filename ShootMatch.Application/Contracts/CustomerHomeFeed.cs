namespace ShootMatch.Application.Contracts;

public sealed class PortfolioFeedItem
{
    public required Guid PhotoId { get; init; }
    public required string ImageUrl { get; init; }
    public required Guid PhotographerId { get; init; }
    public required string PhotographerName { get; init; }
    public string? AvatarUrl { get; init; }
    public required DateTime CreatedAt { get; init; }
}

public sealed class FeaturedPhotographerCard
{
    public required Guid Id { get; init; }
    public required string DisplayName { get; init; }
    public required string Region { get; init; }
    public string? AvatarUrl { get; init; }
    public required double Rating { get; init; }
    public required bool IsPremium { get; init; }
    public IReadOnlyList<string> PreviewPhotos { get; init; } = [];
}

public sealed class CustomerHomeFeed
{
    public IReadOnlyList<FeaturedPhotographerCard> Featured { get; init; } = [];
    public IReadOnlyList<PortfolioFeedItem> LatestPhotos { get; init; } = [];
}
