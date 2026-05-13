namespace ShootMatch.Infrastructure.Persistence.Entities;

public sealed class ReviewRecord
{
    public Guid Id { get; set; }
    public Guid BookingId { get; set; }
    public Guid AuthorCustomerId { get; set; }
    public Guid TargetPhotographerId { get; set; }
    public int Rating { get; set; } // 1-5
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
