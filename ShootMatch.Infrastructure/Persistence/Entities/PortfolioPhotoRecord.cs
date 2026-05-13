namespace ShootMatch.Infrastructure.Persistence.Entities;

public sealed class PortfolioPhotoRecord
{
    public Guid Id { get; set; }
    public Guid PhotographerId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string ThumbnailUrl { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsIndexed { get; set; }
    public DateTime CreatedAt { get; set; }
    public PhotographerRecord Photographer { get; set; } = null!;
}
