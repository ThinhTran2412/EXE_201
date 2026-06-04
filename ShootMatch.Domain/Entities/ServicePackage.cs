namespace ShootMatch.Domain.Entities;

public sealed class ServicePackage
{
    public Guid Id { get; init; }
    public Guid PhotographerId { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Subtitle { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string HeroTitle { get; init; } = string.Empty;
    public string HeroSubtitle { get; init; } = string.Empty;
    public string CallToAction { get; init; } = string.Empty;
    public decimal Price { get; init; }
    public int DurationHours { get; init; }
    public bool IsActive { get; init; } = true;
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public IReadOnlyList<ServicePackageMedia> Media { get; init; } = [];
}
