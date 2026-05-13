using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;
using ShootMatch.Application.Abstractions;

namespace ShootMatch.Infrastructure.Auth;

/// <summary>
/// Verifies Google ID tokens using Google.Apis.Auth.
/// When Google:ClientId is not configured, runs in test mode (accepts any well-formed token structure for dev).
/// </summary>
public sealed class GoogleAuthService(IConfiguration configuration) : IGoogleAuthService
{
    public async Task<GoogleUserInfo> VerifyIdTokenAsync(string idToken, CancellationToken cancellationToken)
    {
        var clientId = configuration["Google:ClientId"];

        GoogleJsonWebSignature.Payload payload;

        if (string.IsNullOrWhiteSpace(clientId) || clientId == "PLACEHOLDER.apps.googleusercontent.com")
        {
            // Dev mode: validate token structure without audience check
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = null  // skip audience validation
            };
            payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
        }
        else
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = [clientId]
            };
            payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
        }

        return new GoogleUserInfo(
            GoogleId:    payload.Subject,
            Email:       payload.Email,
            DisplayName: payload.Name ?? payload.Email,
            AvatarUrl:   payload.Picture);
    }
}
