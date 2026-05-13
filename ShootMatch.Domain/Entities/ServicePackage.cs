namespace ShootMatch.Domain.Entities;

public sealed class ServicePackage
{
    public Guid Id { get; init; }
    public Guid PhotographerId { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public decimal Price { get; init; }
    public int DurationHours { get; init; }
    public bool IsActive { get; init; } = true;
    public DateTime CreatedAt { get; init; }
}
