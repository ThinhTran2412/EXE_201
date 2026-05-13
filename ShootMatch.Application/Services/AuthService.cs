using ShootMatch.Application.Abstractions;
using ShootMatch.Application.Contracts;
using ShootMatch.Domain.Entities;

namespace ShootMatch.Application.Services;

public sealed class AuthService(
    IOtpService otpService,
    IAuthTokenService authTokenService,
    IAuthSessionRepository authSessionRepository,
    ICustomerRepository customerRepository,
    IPasswordHasher passwordHasher,
    IGoogleAuthService googleAuthService)
{
    public Task SendOtpAsync(string phone, CancellationToken cancellationToken)
        => otpService.SendAsync(phone, cancellationToken);

    public async Task<AuthTokens> VerifyOtpAsync(string phone, string otpCode, CancellationToken cancellationToken)
    {
        var isValid = await otpService.VerifyAsync(phone, otpCode, cancellationToken);
        if (!isValid)
        {
            throw new InvalidOperationException("Invalid OTP code.");
        }

        var customer = await customerRepository.GetByPhoneAsync(phone, cancellationToken)
            ?? new Customer
            {
                Id = Guid.NewGuid(),
                DisplayName = string.Empty,
                Phone = phone,
                Email = string.Empty,
                Region = string.Empty,
                AvatarUrl = string.Empty,
                IsVerified = true,
                CreatedAt = DateTime.UtcNow
            };

        await customerRepository.UpsertAsync(new Customer
        {
            Id = customer.Id,
            DisplayName = customer.DisplayName,
            Phone = customer.Phone,
            Email = customer.Email,
            Region = customer.Region,
            AvatarUrl = customer.AvatarUrl,
            IsVerified = true,
            CreatedAt = customer.CreatedAt == default ? DateTime.UtcNow : customer.CreatedAt
        }, cancellationToken);

        var refreshToken = authTokenService.GenerateRefreshToken();
        var refreshExpiry = DateTime.UtcNow.AddDays(14);

        await authSessionRepository.SaveAsync(new AuthSession
        {
            Id = Guid.NewGuid(),
            CustomerId = customer.Id,
            RefreshToken = refreshToken,
            ExpiresAt = refreshExpiry,
            IsRevoked = false,
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);

        return new AuthTokens
        {
            AccessToken          = authTokenService.GenerateAccessToken(customer.Id, customer.Phone, "customer"),
            RefreshToken         = refreshToken,
            RefreshTokenExpiresAt = refreshExpiry
        };
    }

    public async Task<AuthTokens> RefreshAsync(string refreshToken, CancellationToken cancellationToken)
    {
        var session = await authSessionRepository.GetByRefreshTokenAsync(refreshToken, cancellationToken)
            ?? throw new InvalidOperationException("Refresh token is invalid.");

        if (session.IsRevoked || session.ExpiresAt < DateTime.UtcNow)
        {
            throw new InvalidOperationException("Refresh token expired or revoked.");
        }

        var customer = await customerRepository.GetByIdAsync(session.CustomerId, cancellationToken)
            ?? throw new InvalidOperationException("Customer not found.");

        await authSessionRepository.RevokeAsync(refreshToken, cancellationToken);

        var newRefreshToken = authTokenService.GenerateRefreshToken();
        var refreshExpiry = DateTime.UtcNow.AddDays(14);
        await authSessionRepository.SaveAsync(new AuthSession
        {
            Id = Guid.NewGuid(),
            CustomerId = customer.Id,
            RefreshToken = newRefreshToken,
            ExpiresAt = refreshExpiry,
            IsRevoked = false,
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);

        return new AuthTokens
        {
            AccessToken          = authTokenService.GenerateAccessToken(customer.Id, customer.Phone, "customer"),
            RefreshToken         = newRefreshToken,
            RefreshTokenExpiresAt = refreshExpiry
        };
    }

    // ── Email + Password ────────────────────────────────────────────────────

    public async Task<AuthTokens> RegisterWithEmailAsync(
        string email, string password, string displayName,
        CancellationToken cancellationToken)
    {
        var existing = await customerRepository.GetByEmailAsync(email, cancellationToken);
        if (existing is not null)
            throw new InvalidOperationException("Email already registered.");

        var customer = new Customer
        {
            Id          = Guid.NewGuid(),
            Email       = email,
            DisplayName = displayName,
            Phone       = string.Empty,
            Region      = string.Empty,
            AvatarUrl   = string.Empty,
            IsVerified  = false,
            PasswordHash = passwordHasher.Hash(password),
            CreatedAt   = DateTime.UtcNow
        };

        await customerRepository.UpsertAsync(customer, cancellationToken);
        return await IssueTokensAsync(customer, cancellationToken);
    }

    public async Task<AuthTokens> LoginWithEmailAsync(
        string email, string password,
        CancellationToken cancellationToken)
    {
        var customer = await customerRepository.GetByEmailAsync(email, cancellationToken)
            ?? throw new InvalidOperationException("Email or password incorrect.");

        if (customer.PasswordHash is null ||
            !passwordHasher.Verify(password, customer.PasswordHash))
            throw new InvalidOperationException("Email or password incorrect.");

        return await IssueTokensAsync(customer, cancellationToken);
    }

    // ── Google OAuth ─────────────────────────────────────────────────────────

    public async Task<AuthTokens> LoginWithGoogleAsync(
        string idToken,
        CancellationToken cancellationToken)
    {
        var info = await googleAuthService.VerifyIdTokenAsync(idToken, cancellationToken);

        // Find existing account by googleId or email
        var customer =
            await customerRepository.GetByGoogleIdAsync(info.GoogleId, cancellationToken)
            ?? await customerRepository.GetByEmailAsync(info.Email, cancellationToken);

        if (customer is null)
        {
            // First-time Google login — auto-register
            customer = new Customer
            {
                Id          = Guid.NewGuid(),
                Email       = info.Email,
                DisplayName = info.DisplayName,
                AvatarUrl   = info.AvatarUrl ?? string.Empty,
                Phone       = string.Empty,
                Region      = string.Empty,
                IsVerified  = true,
                GoogleId    = info.GoogleId,
                CreatedAt   = DateTime.UtcNow
            };
        }
        else
        {
            // Link googleId if this email was registered another way
            customer = new Customer
            {
                Id           = customer.Id,
                Email        = customer.Email,
                DisplayName  = customer.DisplayName,
                AvatarUrl    = customer.AvatarUrl,
                Phone        = customer.Phone,
                Region       = customer.Region,
                IsVerified   = customer.IsVerified,
                IsActive     = customer.IsActive,
                PasswordHash = customer.PasswordHash,
                GoogleId     = info.GoogleId,
                PreferredBudgetMin = customer.PreferredBudgetMin,
                PreferredBudgetMax = customer.PreferredBudgetMax,
                CreatedAt    = customer.CreatedAt,
                LastSeenAt   = customer.LastSeenAt
            };
        }

        await customerRepository.UpsertAsync(customer, cancellationToken);
        return await IssueTokensAsync(customer, cancellationToken);
    }

    // ── Private helper ───────────────────────────────────────────────────────

    private async Task<AuthTokens> IssueTokensAsync(Customer customer, CancellationToken cancellationToken)
    {
        var refreshToken  = authTokenService.GenerateRefreshToken();
        var refreshExpiry = DateTime.UtcNow.AddDays(14);

        await authSessionRepository.SaveAsync(new AuthSession
        {
            Id           = Guid.NewGuid(),
            CustomerId   = customer.Id,
            RefreshToken = refreshToken,
            ExpiresAt    = refreshExpiry,
            IsRevoked    = false,
            CreatedAt    = DateTime.UtcNow
        }, cancellationToken);

        return new AuthTokens
        {
            AccessToken           = authTokenService.GenerateAccessToken(customer.Id, customer.Phone, "customer"),
            RefreshToken          = refreshToken,
            RefreshTokenExpiresAt = refreshExpiry
        };
    }
}
