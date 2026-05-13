using ShootMatch.Application.Abstractions;
using ShootMatch.Application.Contracts;
using ShootMatch.Domain.Entities;

namespace ShootMatch.Application.Services;

/// <summary>
/// Handles OTP-based authentication for Photographers.
/// Uses the same OTP mechanism as customers but issues tokens with role = "photographer".
/// </summary>
public sealed class PhotographerAuthService(
    IOtpService otpService,
    IAuthTokenService authTokenService,
    IAuthSessionRepository authSessionRepository,
    IPhotographerRepository photographerRepository,
    IPasswordHasher passwordHasher,
    IGoogleAuthService googleAuthService)
{
    public Task SendOtpAsync(string phone, CancellationToken cancellationToken)
        => otpService.SendAsync(phone, cancellationToken);

    public async Task<AuthTokens> VerifyOtpAsync(string phone, string otpCode, CancellationToken cancellationToken)
    {
        var isValid = await otpService.VerifyAsync(phone, otpCode, cancellationToken);
        if (!isValid)
            throw new InvalidOperationException("Invalid OTP code.");

        var photographer = await photographerRepository.GetByPhoneAsync(phone, cancellationToken)
            ?? new Photographer
            {
                Id          = Guid.NewGuid(),
                DisplayName = string.Empty,
                Phone       = phone,
                CreatedAt   = DateTime.UtcNow,
                UpdatedAt   = DateTime.UtcNow
            };

        await photographerRepository.UpsertAsync(photographer, cancellationToken);

        var refreshToken  = authTokenService.GenerateRefreshToken();
        var refreshExpiry = DateTime.UtcNow.AddDays(14);

        await authSessionRepository.SaveAsync(new AuthSession
        {
            Id           = Guid.NewGuid(),
            CustomerId   = photographer.Id, // reuse field for photographer id
            RefreshToken = refreshToken,
            ExpiresAt    = refreshExpiry,
            IsRevoked    = false,
            CreatedAt    = DateTime.UtcNow
        }, cancellationToken);

        return new AuthTokens
        {
            AccessToken          = authTokenService.GenerateAccessToken(photographer.Id, phone, "photographer"),
            RefreshToken         = refreshToken,
            RefreshTokenExpiresAt = refreshExpiry
        };
    }

    public async Task<AuthTokens> RefreshAsync(string refreshToken, CancellationToken cancellationToken)
    {
        var session = await authSessionRepository.GetByRefreshTokenAsync(refreshToken, cancellationToken)
            ?? throw new InvalidOperationException("Refresh token is invalid.");

        if (session.IsRevoked || session.ExpiresAt < DateTime.UtcNow)
            throw new InvalidOperationException("Refresh token expired or revoked.");

        var photographer = await photographerRepository.GetByIdAsync(session.CustomerId, cancellationToken)
            ?? throw new InvalidOperationException("Photographer not found.");

        await authSessionRepository.RevokeAsync(refreshToken, cancellationToken);

        var newRefreshToken = authTokenService.GenerateRefreshToken();
        var refreshExpiry   = DateTime.UtcNow.AddDays(14);
        await authSessionRepository.SaveAsync(new AuthSession
        {
            Id           = Guid.NewGuid(),
            CustomerId   = photographer.Id,
            RefreshToken = newRefreshToken,
            ExpiresAt    = refreshExpiry,
            IsRevoked    = false,
            CreatedAt    = DateTime.UtcNow
        }, cancellationToken);

        return new AuthTokens
        {
            AccessToken          = authTokenService.GenerateAccessToken(photographer.Id, photographer.Phone, "photographer"),
            RefreshToken         = newRefreshToken,
            RefreshTokenExpiresAt = refreshExpiry
        };
    }

    // ── Email + Password ────────────────────────────────────────────────────

    public async Task<AuthTokens> RegisterWithEmailAsync(
        string email, string password, string displayName,
        CancellationToken cancellationToken)
    {
        var existing = await photographerRepository.GetByEmailAsync(email, cancellationToken);
        if (existing is not null)
            throw new InvalidOperationException("Email already registered.");

        var photographer = new Photographer
        {
            Id           = Guid.NewGuid(),
            Email        = email,
            DisplayName  = displayName,
            Phone        = string.Empty,
            Region       = string.Empty,
            AvatarUrl    = string.Empty,
            PasswordHash = passwordHasher.Hash(password),
            CreatedAt    = DateTime.UtcNow,
            UpdatedAt    = DateTime.UtcNow
        };

        await photographerRepository.UpsertAsync(photographer, cancellationToken);
        return await IssueTokensAsync(photographer, cancellationToken);
    }

    public async Task<AuthTokens> LoginWithEmailAsync(
        string email, string password,
        CancellationToken cancellationToken)
    {
        var photographer = await photographerRepository.GetByEmailAsync(email, cancellationToken)
            ?? throw new InvalidOperationException("Email or password incorrect.");

        if (photographer.PasswordHash is null ||
            !passwordHasher.Verify(password, photographer.PasswordHash))
            throw new InvalidOperationException("Email or password incorrect.");

        return await IssueTokensAsync(photographer, cancellationToken);
    }

    // ── Google OAuth ─────────────────────────────────────────────────────────

    public async Task<AuthTokens> LoginWithGoogleAsync(
        string idToken,
        CancellationToken cancellationToken)
    {
        var info = await googleAuthService.VerifyIdTokenAsync(idToken, cancellationToken);

        var photographer =
            await photographerRepository.GetByGoogleIdAsync(info.GoogleId, cancellationToken)
            ?? await photographerRepository.GetByEmailAsync(info.Email, cancellationToken);

        if (photographer is null)
        {
            photographer = new Photographer
            {
                Id          = Guid.NewGuid(),
                Email       = info.Email,
                DisplayName = info.DisplayName,
                AvatarUrl   = info.AvatarUrl ?? string.Empty,
                Phone       = string.Empty,
                Region      = string.Empty,
                GoogleId    = info.GoogleId,
                CreatedAt   = DateTime.UtcNow,
                UpdatedAt   = DateTime.UtcNow
            };
        }
        else
        {
            photographer = new Photographer
            {
                Id                   = photographer.Id,
                Email                = photographer.Email,
                DisplayName          = photographer.DisplayName,
                AvatarUrl            = photographer.AvatarUrl,
                Phone                = photographer.Phone,
                Region               = photographer.Region,
                Bio                  = photographer.Bio,
                CoverPhotoUrl        = photographer.CoverPhotoUrl,
                InstagramUrl         = photographer.InstagramUrl,
                MinBudget            = photographer.MinBudget,
                MaxBudget            = photographer.MaxBudget,
                Rating               = photographer.Rating,
                IsPremium            = photographer.IsPremium,
                IsAvailable          = photographer.IsAvailable,
                AcceptsInstantBooking = photographer.AcceptsInstantBooking,
                VerificationStatus   = photographer.VerificationStatus,
                PasswordHash         = photographer.PasswordHash,
                GoogleId             = info.GoogleId,
                CreatedAt            = photographer.CreatedAt,
                UpdatedAt            = DateTime.UtcNow,
                DeletedAt            = photographer.DeletedAt
            };
        }

        await photographerRepository.UpsertAsync(photographer, cancellationToken);
        return await IssueTokensAsync(photographer, cancellationToken);
    }

    // ── Private helper ───────────────────────────────────────────────────────

    private async Task<AuthTokens> IssueTokensAsync(Photographer photographer, CancellationToken cancellationToken)
    {
        var refreshToken  = authTokenService.GenerateRefreshToken();
        var refreshExpiry = DateTime.UtcNow.AddDays(14);

        await authSessionRepository.SaveAsync(new AuthSession
        {
            Id           = Guid.NewGuid(),
            CustomerId   = photographer.Id,
            RefreshToken = refreshToken,
            ExpiresAt    = refreshExpiry,
            IsRevoked    = false,
            CreatedAt    = DateTime.UtcNow
        }, cancellationToken);

        return new AuthTokens
        {
            AccessToken           = authTokenService.GenerateAccessToken(photographer.Id, photographer.Phone, "photographer"),
            RefreshToken          = refreshToken,
            RefreshTokenExpiresAt = refreshExpiry
        };
    }
}
