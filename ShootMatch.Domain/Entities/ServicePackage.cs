namespace ShootMatch.Domain.Entities;

public enum LocationType
{
    Studio = 1,
    Outdoor = 2,
    Indoor = 3,
    Flexible = 4
}

public enum AgeGroup
{
    Newborn = 1,
    Kids = 2,
    Youth = 3,
    Adults = 4,
    Seniors = 5,
    Pets = 6
}

public enum GroupSize
{
    Solo = 1,
    Couple = 2,
    SmallGroup = 3,
    LargeGroup = 4
}

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
    public LocationType LocationType { get; init; } = LocationType.Flexible;
    public AgeGroup AgeGroup { get; init; } = AgeGroup.Adults;
    public GroupSize GroupSize { get; init; } = GroupSize.Solo;
    public bool IsActive { get; init; } = true;
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public IReadOnlyList<ServicePackageMedia> Media { get; init; } = [];
}
