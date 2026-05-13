namespace ShootMatch.Application.Abstractions;

public interface IAuthTokenService
{
    /// <summary>
    /// Generates an access token for a Customer.
    /// </summary>
    string GenerateAccessToken(Guid userId, string phone, string role = "customer");

    string GenerateRefreshToken();
}
