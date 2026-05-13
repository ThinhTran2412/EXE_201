namespace ShootMatch.Application.Abstractions;

/// <summary>
/// Provides password hashing and verification.
/// Implemented with BCrypt.Net-Next in Infrastructure.
/// </summary>
public interface IPasswordHasher
{
    /// <summary>Returns a BCrypt hash of the given password.</summary>
    string Hash(string password);

    /// <summary>Returns true if the password matches the stored hash.</summary>
    bool Verify(string password, string hash);
}
