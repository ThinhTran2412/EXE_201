using ShootMatch.Domain.Entities;

namespace ShootMatch.Api.Contracts;

public sealed record ServicePackageMediaRequest(
    string ImageUrl,
    int SortOrder);

public sealed record ServicePackageRequest(
    string Title,
    string Subtitle,
    string Description,
    string HeroTitle,
    string HeroSubtitle,
    string CallToAction,
    decimal Price,
    int DurationHours,
    LocationType LocationType,
    AgeGroup AgeGroup,
    GroupSize GroupSize,
    bool IsActive,
    IReadOnlyList<ServicePackageMediaRequest> Media);

public sealed record UpdateServicePackageRequest(
    string Title,
    string Subtitle,
    string Description,
    string HeroTitle,
    string HeroSubtitle,
    string CallToAction,
    decimal Price,
    int DurationHours,
    LocationType LocationType,
    AgeGroup AgeGroup,
    GroupSize GroupSize,
    bool IsActive,
    IReadOnlyList<ServicePackageMediaRequest> Media);
