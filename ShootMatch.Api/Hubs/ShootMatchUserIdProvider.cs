using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace ShootMatch.Api.Hubs;

/// <summary>Map JWT claims → SignalR User identifier để gửi thông báo theo tài khoản.</summary>
public sealed class ShootMatchUserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection)
    {
        var user = connection.User;
        if (user is null) return null;

        var role = user.FindFirst(ClaimTypes.Role)?.Value;
        var idClaim = role switch
        {
            "customer" => user.FindFirst("customer_id")?.Value,
            "photographer" => user.FindFirst("photographer_id")?.Value,
            "staff" or "admin" => user.FindFirst("staff_id")?.Value ?? user.FindFirst("admin_id")?.Value,
            _ => null
        };

        return Guid.TryParse(idClaim, out _) ? idClaim : null;
    }
}
