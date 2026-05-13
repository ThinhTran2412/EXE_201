namespace ShootMatch.Domain.Entities;

public sealed class PhotographerAvailability
{
    public Guid Id { get; init; }
    public Guid PhotographerId { get; init; }

    // Lịch lặp hàng tuần: 0=Sun, 1=Mon, ..., 6=Sat. Null = lịch theo ngày cụ thể
    public int? DayOfWeek { get; init; }

    // Lịch ngày cụ thể (override hoặc block)
    public DateOnly? SpecificDate { get; init; }

    public TimeOnly StartTime { get; init; }
    public TimeOnly EndTime { get; init; }

    // Available | Blocked (Blocked = đã có lịch hoặc không muốn nhận)
    public string SlotType { get; init; } = "Available";

    public DateTime CreatedAt { get; init; }
}
