using ShootMatch.Domain.Entities;

namespace ShootMatch.Api.GraphQL;

public sealed class DetailedPortfolioPhoto
{
    public Guid Id { get; set; }
    public Guid PhotographerId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string ThumbnailUrl { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsIndexed { get; set; }
    public string DominantColors { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<Style> Styles { get; set; } = [];
    public List<Concept> Concepts { get; set; } = [];
}
