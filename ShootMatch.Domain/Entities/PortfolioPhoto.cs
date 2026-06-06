namespace ShootMatch.Domain.Entities;

public sealed class PortfolioPhoto
{
    public Guid Id { get; init; }
    public Guid PhotographerId { get; init; }
    public string ImageUrl { get; init; } = string.Empty;
    public string ThumbnailUrl { get; init; } = string.Empty;
    public int DisplayOrder { get; init; }
    public bool IsIndexed { get; init; }  // true khi đã encode xong
    public string DominantColors { get; init; } = string.Empty; // Comma-separated HEX colors
    public List<Guid> StyleIds { get; init; } = [];
    public List<Guid> ConceptIds { get; init; } = [];
    public DateTime CreatedAt { get; init; }
}
