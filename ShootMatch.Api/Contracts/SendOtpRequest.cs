namespace ShootMatch.Api.Contracts;

public sealed class SendOtpRequest
{
    public required string Phone { get; init; }
}
