namespace ShootMatch.Domain.Entities;

public sealed class Concept
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string Keywords { get; init; } = string.Empty; // Comma-separated or space-separated search terms
    public string Status { get; init; } = "Pending"; // Pending, Approved, Rejected
    public Guid? CreatedById { get; init; } // Photographer ID who proposed it, null if system
    public Guid? ApprovedById { get; init; } // Staff ID who approved it
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}
