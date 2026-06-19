using ShootMatch.Domain.Entities;

namespace ShootMatch.Infrastructure.Persistence.Entities;

public sealed class PhotographerEquipmentRecord
{
    public Guid Id { get; set; }
    public Guid PhotographerId { get; set; }
    public EquipmentCategory Category { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsPrimary { get; set; }
    
    public PhotographerRecord Photographer { get; set; } = null!;
}
