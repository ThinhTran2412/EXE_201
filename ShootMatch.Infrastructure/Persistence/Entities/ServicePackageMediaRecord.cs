namespace ShootMatch.Infrastructure.Persistence.Entities;

public sealed class ServicePackageMediaRecord
{
    public Guid Id { get; set; }
    public Guid ServicePackageId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public int SortOrder { get; set; }

    public ServicePackageRecord ServicePackage { get; set; } = null!;
}
