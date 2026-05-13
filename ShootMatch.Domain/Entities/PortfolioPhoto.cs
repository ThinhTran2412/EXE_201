namespace ShootMatch.Domain.Entities;

public sealed class PortfolioPhoto
{
    public Guid Id { get; init; }
    public Guid PhotographerId { get; init; }
    public string ImageUrl { get; init; } = string.Empty;
    public string ThumbnailUrl { get; init; } = string.Empty;
    public int DisplayOrder { get; init; }
    public bool IsIndexed { get; init; }  // true khi đã encode xong
    public DateTime CreatedAt { get; init; }
}
