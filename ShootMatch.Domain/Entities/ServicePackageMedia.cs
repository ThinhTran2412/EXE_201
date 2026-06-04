namespace ShootMatch.Domain.Entities;

public sealed class ServicePackageMedia
{
    public Guid Id { get; init; }
    public Guid ServicePackageId { get; init; }
    public string ImageUrl { get; init; } = string.Empty;
    public int SortOrder { get; init; }
}
