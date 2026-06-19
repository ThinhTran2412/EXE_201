namespace ShootMatch.Domain.Entities;

public sealed class PhotographerEquipment
{
    public Guid Id { get; init; }
    public Guid PhotographerId { get; init; }
    public EquipmentCategory Category { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public bool IsPrimary { get; init; }
    
    // Navigation property (optional, since EF maps via shadow property or directly if defined)
    // public Photographer? Photographer { get; init; }
}
