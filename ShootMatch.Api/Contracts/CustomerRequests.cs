using Microsoft.AspNetCore.Http;

namespace ShootMatch.Api.Contracts;

public sealed record UploadCustomerPhotoRequest(IFormFile File);
