namespace ShootMatch.Api.Contracts;

public sealed record ServicePackageRequest(
    string Title,
    string Description,
    decimal Price,
    int DurationHours,
    bool IsActive);

public sealed record UpdateServicePackageRequest(
    string Title,
    string Description,
    decimal Price,
    int DurationHours,
    bool IsActive);
