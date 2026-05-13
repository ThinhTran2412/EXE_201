namespace ShootMatch.Infrastructure.Persistence.Entities;

public sealed class PortfolioEmbeddingRecord
{
    public Guid Id { get; set; }
    public Guid PhotographerId { get; set; }
    public string VectorJson { get; set; } = "[]";
    public PhotographerRecord Photographer { get; set; } = null!;
}
