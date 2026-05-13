namespace ShootMatch.Domain.Entities;

public sealed class SearchSession
{
    public Guid Id { get; init; }
    public Guid CustomerId { get; init; }
    public int InputImageCount { get; init; }
    public string? Region { get; init; }
    public decimal? Budget { get; init; }
    public string? ReferenceImageUrlsJson { get; init; } // JSON array of image URLs
    public string? StyleVectorJson { get; init; }        // Cached style vector
    public string Status { get; init; } = "Pending";    // Pending | Ready | Expired
    public DateTime CreatedAt { get; init; }
    public DateTime? ExpiresAt { get; init; }
}
