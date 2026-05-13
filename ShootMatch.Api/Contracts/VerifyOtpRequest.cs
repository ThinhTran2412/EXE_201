namespace ShootMatch.Api.Contracts;

public sealed class VerifyOtpRequest
{
    public required string Phone { get; init; }
    public required string OtpCode { get; init; }
}
