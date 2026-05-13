namespace ShootMatch.Api.Contracts;

/// <summary>Request contract for photographer OTP login.</summary>
public sealed record PhotographerSendOtpRequest(string Phone);

/// <summary>Request contract for photographer OTP verification.</summary>
public sealed record PhotographerVerifyOtpRequest(string Phone, string OtpCode);
