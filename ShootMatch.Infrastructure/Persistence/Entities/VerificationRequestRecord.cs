namespace ShootMatch.Infrastructure.Persistence.Entities;

public sealed class VerificationRequestRecord
{
    public Guid Id { get; set; }
    public Guid PhotographerId { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public string DocumentImageUrl { get; set; } = string.Empty;
    public string SelfieUrl { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // Pending | Approved | Rejected
    public string? ReviewedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
}
