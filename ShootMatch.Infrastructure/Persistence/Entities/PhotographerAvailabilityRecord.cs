namespace ShootMatch.Infrastructure.Persistence.Entities;

public sealed class PhotographerAvailabilityRecord
{
    public Guid Id { get; set; }
    public Guid PhotographerId { get; set; }
    public int? DayOfWeek { get; set; }       // 0=Sun..6=Sat, null = specific date
    public DateOnly? SpecificDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string SlotType { get; set; } = "Available"; // Available | Blocked
    public DateTime CreatedAt { get; set; }
    public PhotographerRecord Photographer { get; set; } = null!;
}
