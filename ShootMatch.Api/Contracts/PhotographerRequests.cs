using Microsoft.AspNetCore.Http;

namespace ShootMatch.Api.Contracts;

public sealed record RegisterPhotographerRequest(
    string DisplayName,
    string Bio,
    string Quote,
    string Phone,
    string Email,
    string Region,          // HN | HCM | DN | HP | CT | OTHER
    decimal MinBudget,
    decimal MaxBudget,
    string AvatarUrl,
    string CoverPhotoUrl,
    string? InstagramUrl,
    bool AcceptsInstantBooking);

public sealed record UpdatePhotographerProfileRequest(
    string? DisplayName,
    string? Bio,
    string? Quote,
    string? Phone,
    string? Email,
    string? Region,
    string? AvatarUrl,
    string? CoverPhotoUrl,
    string? InstagramUrl,
    decimal? MinBudget,
    decimal? MaxBudget,
    bool? AcceptsInstantBooking);

public sealed record UpdatePhotographerPersonalInfoRequest(
    string? NationalId,
    string? Phone,
    string? Email,
    string? Region,
    string? PersonalAddress,
    string? VerificationDocumentFrontUrl,
    string? VerificationDocumentBackUrl,
    string? VerificationPortraitUrl);

public sealed record SetAvailabilityRequest(bool IsAvailable);

public sealed record CancelBookingRequest(string Reason);

public sealed record UploadPhotographerPhotoRequest(IFormFile File);

public sealed record EquipmentDto(
    Guid? Id,
    int Category,
    string Name,
    string? Description,
    bool IsPrimary);

public sealed record UpdateEquipmentsRequest(List<EquipmentDto> Equipments);
