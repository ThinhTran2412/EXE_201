namespace ShootMatch.Infrastructure.Persistence.Entities;

public sealed class ServicePackageRecord
{
    public Guid Id { get; set; }
    public Guid PhotographerId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string HeroTitle { get; set; } = string.Empty;
    public string HeroSubtitle { get; set; } = string.Empty;
    public string CallToAction { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int DurationHours { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public PhotographerRecord Photographer { get; set; } = null!;
    public List<ServicePackageMediaRecord> Media { get; set; } = [];
}

public sealed class ServicePackageMediaRecord
{
    public Guid Id { get; set; }
    public Guid ServicePackageId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public ServicePackageRecord ServicePackage { get; set; } = null!;
}
