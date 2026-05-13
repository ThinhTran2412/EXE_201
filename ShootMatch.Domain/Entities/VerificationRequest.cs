namespace ShootMatch.Domain.Entities;

public sealed class VerificationRequest
{
    public Guid Id { get; init; }
    public Guid PhotographerId { get; init; }
    public string DocumentType { get; init; } = string.Empty; // e.g. CCCD
    public string DocumentImageUrl { get; init; } = string.Empty;
    public string SelfieUrl { get; init; } = string.Empty;
    // Pending | Approved | Rejected
    public string Status { get; init; } = "Pending";
    public string? ReviewedBy { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? ReviewedAt { get; init; }
}
