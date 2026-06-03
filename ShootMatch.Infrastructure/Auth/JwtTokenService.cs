using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using ShootMatch.Application.Abstractions;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace ShootMatch.Infrastructure.Auth;

public sealed class JwtTokenService(IConfiguration configuration) : IAuthTokenService
{
    public string GenerateAccessToken(Guid userId, string phone, string role = "customer")
    {
        var key      = configuration["Jwt:Key"]      ?? "shootmatch-dev-key-change-me-immediately";
        var issuer   = configuration["Jwt:Issuer"]   ?? "shootmatch-api";
        var audience = configuration["Jwt:Audience"] ?? "shootmatch-client";

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim("user_id",              userId.ToString()),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.MobilePhone,    phone),
            new Claim(ClaimTypes.Role,           role),

            role switch
            {
                "customer" => new Claim("customer_id", userId.ToString()),
                "staff" => new Claim("staff_id", userId.ToString()),
                "admin" => new Claim("admin_id", userId.ToString()),
                _ => new Claim("photographer_id", userId.ToString())
            }
        };

        var token = new JwtSecurityToken(
            issuer:             issuer,
            audience:           audience,
            claims:             claims,
            expires:            DateTime.UtcNow.AddHours(2),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }
}
