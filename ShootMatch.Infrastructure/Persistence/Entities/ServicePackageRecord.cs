namespace ShootMatch.Infrastructure.Persistence.Entities;

public sealed class ServicePackageRecord
{
    public Guid Id { get; set; }
    public Guid PhotographerId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int DurationHours { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public PhotographerRecord Photographer { get; set; } = null!;
}
