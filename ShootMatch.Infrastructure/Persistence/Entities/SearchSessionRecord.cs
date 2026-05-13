namespace ShootMatch.Infrastructure.Persistence.Entities;

public sealed class SearchSessionRecord
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public int InputImageCount { get; set; }
    public string Region { get; set; } = string.Empty;
    public decimal? Budget { get; set; }
    public string? ReferenceImageUrlsJson { get; set; }
    public string? StyleVectorJson { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
