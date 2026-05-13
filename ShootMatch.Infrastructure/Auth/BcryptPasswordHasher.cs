using BCrypt.Net;
using ShootMatch.Application.Abstractions;

namespace ShootMatch.Infrastructure.Auth;

/// <summary>
/// BCrypt-based password hasher using BCrypt.Net-Next.
/// Work factor 12 is recommended for production security.
/// </summary>
public sealed class BcryptPasswordHasher : IPasswordHasher
{
    private const int WorkFactor = 12;

    public string Hash(string password)
        => BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);

    public bool Verify(string password, string hash)
        => BCrypt.Net.BCrypt.Verify(password, hash);
}
