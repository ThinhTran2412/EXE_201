using ShootMatch.Application.Abstractions;
using ShootMatch.Application.Contracts;
using ShootMatch.Domain.Entities;

namespace ShootMatch.Application.Services;

public sealed class StaffAuthService(
    IOtpService otpService,
    IAuthTokenService authTokenService,
    IAuthSessionRepository authSessionRepository,
    IStaffRepository staffRepository,
    IGoogleAuthService googleAuthService,
    IPasswordHasher passwordHasher)
{
    public Task SendOtpAsync(string phone, CancellationToken cancellationToken)
        => otpService.SendAsync(phone, cancellationToken);

    public async Task<object> VerifyOtpAsync(string phone, string otpCode, CancellationToken cancellationToken)
    {
        var isValid = await otpService.VerifyAsync(phone, otpCode, cancellationToken);
        if (!isValid)
        {
            throw new InvalidOperationException("Invalid OTP code.");
        }

        var staff = await staffRepository.GetByPhoneAsync(phone, cancellationToken);
        if (staff is null)
        {
            staff = new Staff
            {
                Id = Guid.NewGuid(),
                Email = string.Empty,
                DisplayName = string.Empty,
                Phone = phone,
                Role = "staff",
                ApprovalStatus = "Pending",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await staffRepository.UpsertAsync(staff, cancellationToken);
            return new
            {
                pending = true,
                message = "Đã đăng ký bằng số điện thoại. Tài khoản đang chờ admin duyệt."
            };
        }

        if (!string.Equals(staff.ApprovalStatus, "Approved", StringComparison.OrdinalIgnoreCase))
        {
            return new
            {
                pending = true,
                message = "Staff account is pending approval."
            };
        }

        return await IssueTokensAsync(staff, cancellationToken);
    }

    public async Task<AuthTokens> RegisterWithEmailAsync(string email, string password, string displayName, CancellationToken cancellationToken)
    {
        var existing = await staffRepository.GetByEmailAsync(email, cancellationToken);
        if (existing is not null)
            throw new InvalidOperationException("Email already registered.");

        var staff = new Staff
        {
            Id = Guid.NewGuid(),
            Email = email,
            DisplayName = displayName,
            Phone = string.Empty,
            Role = "staff",
            ApprovalStatus = "Pending",
            PasswordHash = passwordHasher.Hash(password),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await staffRepository.UpsertAsync(staff, cancellationToken);
        return await IssueTokensAsync(staff, cancellationToken);
    }

    public async Task<AuthTokens> LoginWithEmailAsync(string email, string password, CancellationToken cancellationToken)
    {
        var staff = await staffRepository.GetByEmailAsync(email, cancellationToken)
            ?? throw new InvalidOperationException("Email or password incorrect.");

        if (!string.Equals(staff.ApprovalStatus, "Approved", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Staff account is pending approval.");

        if (staff.PasswordHash is null || !passwordHasher.Verify(password, staff.PasswordHash))
            throw new InvalidOperationException("Email or password incorrect.");

        return await IssueTokensAsync(staff, cancellationToken);
    }

    public async Task<object> RegisterWithGoogleAsync(string idToken, CancellationToken cancellationToken)
    {
        var info = await googleAuthService.VerifyIdTokenAsync(idToken, cancellationToken);

        var staff = await staffRepository.GetByGoogleIdAsync(info.GoogleId, cancellationToken)
            ?? await staffRepository.GetByEmailAsync(info.Email, cancellationToken);

        if (staff is null)
        {
            staff = new Staff
            {
                Id = Guid.NewGuid(),
                Email = info.Email,
                DisplayName = info.DisplayName,
                Phone = string.Empty,
                Role = "staff",
                ApprovalStatus = "Pending",
                GoogleId = info.GoogleId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await staffRepository.UpsertAsync(staff, cancellationToken);

            return new
            {
                pending = true,
                message = "Đã đăng ký bằng Google. Tài khoản đang chờ admin duyệt."
            };
        }

        if (!string.Equals(staff.ApprovalStatus, "Approved", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Staff account is pending approval.");
        }

        staff = new Staff
        {
            Id = staff.Id,
            DisplayName = staff.DisplayName,
            Phone = staff.Phone,
            Email = staff.Email,
            Role = staff.Role,
            ApprovalStatus = staff.ApprovalStatus,
            PasswordHash = staff.PasswordHash,
            GoogleId = info.GoogleId,
            CreatedAt = staff.CreatedAt,
            UpdatedAt = DateTime.UtcNow,
            ApprovedAt = staff.ApprovedAt,
            ApprovedBy = staff.ApprovedBy,
            DeletedAt = staff.DeletedAt
        };

        await staffRepository.UpsertAsync(staff, cancellationToken);
        return await IssueTokensAsync(staff, cancellationToken);
    }

    public async Task<AuthTokens> LoginWithGoogleAsync(string idToken, CancellationToken cancellationToken)
    {
        var info = await googleAuthService.VerifyIdTokenAsync(idToken, cancellationToken);

        var staff = await staffRepository.GetByGoogleIdAsync(info.GoogleId, cancellationToken)
            ?? await staffRepository.GetByEmailAsync(info.Email, cancellationToken)
            ?? throw new InvalidOperationException("Staff account not found.");

        if (!string.Equals(staff.ApprovalStatus, "Approved", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Staff account is pending approval.");

        if (!string.Equals(staff.GoogleId, info.GoogleId, StringComparison.OrdinalIgnoreCase))
        {
            staff = new Staff
            {
                Id = staff.Id,
                DisplayName = staff.DisplayName,
                Phone = staff.Phone,
                Email = staff.Email,
                Role = staff.Role,
                ApprovalStatus = staff.ApprovalStatus,
                PasswordHash = staff.PasswordHash,
                GoogleId = info.GoogleId,
                CreatedAt = staff.CreatedAt,
                UpdatedAt = DateTime.UtcNow,
                ApprovedAt = staff.ApprovedAt,
                ApprovedBy = staff.ApprovedBy,
                DeletedAt = staff.DeletedAt
            };

            await staffRepository.UpsertAsync(staff, cancellationToken);
        }

        return await IssueTokensAsync(staff, cancellationToken);
    }

    public async Task<AuthTokens> RefreshAsync(string refreshToken, CancellationToken cancellationToken)
    {
        var session = await authSessionRepository.GetByRefreshTokenAsync(refreshToken, cancellationToken)
            ?? throw new InvalidOperationException("Refresh token is invalid.");

        if (session.IsRevoked || session.ExpiresAt < DateTime.UtcNow)
            throw new InvalidOperationException("Refresh token expired or revoked.");

        var staff = await staffRepository.GetByIdAsync(session.CustomerId, cancellationToken)
            ?? throw new InvalidOperationException("Staff not found.");

        if (!string.Equals(staff.ApprovalStatus, "Approved", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Staff account is pending approval.");

        await authSessionRepository.RevokeAsync(refreshToken, cancellationToken);
        return await IssueTokensAsync(staff, cancellationToken);
    }

    private async Task<AuthTokens> IssueTokensAsync(Staff staff, CancellationToken cancellationToken)
    {
        var refreshToken = authTokenService.GenerateRefreshToken();
        var refreshExpiry = DateTime.UtcNow.AddDays(14);

        await authSessionRepository.SaveAsync(new AuthSession
        {
            Id = Guid.NewGuid(),
            CustomerId = staff.Id,
            RefreshToken = refreshToken,
            ExpiresAt = refreshExpiry,
            IsRevoked = false,
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);

        return new AuthTokens
        {
            AccessToken = authTokenService.GenerateAccessToken(staff.Id, staff.Phone, "staff"),
            RefreshToken = refreshToken,
            RefreshTokenExpiresAt = refreshExpiry
        };
    }
}