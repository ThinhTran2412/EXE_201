namespace ShootMatch.Infrastructure.Persistence.Entities;

public sealed class CustomerRecord
{
    public Guid Id { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string AvatarUrl { get; set; } = string.Empty;
    public bool IsVerified { get; set; }
    public decimal? PreferredBudgetMin { get; set; }
    public decimal? PreferredBudgetMax { get; set; }
    public bool IsActive { get; set; } = true;
    public string? PasswordHash { get; set; }
    public string? GoogleId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastSeenAt { get; set; }
    public DateTime? DeletedAt { get; set; }
}
