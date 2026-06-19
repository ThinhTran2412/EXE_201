using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace ShootMatch.Api.Hubs;

[Authorize]
public sealed class LocationHub : Hub
{
    public async Task JoinSession(Guid bookingId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, BookingGroupName(bookingId));
    }

    public async Task LeaveSession(Guid bookingId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, BookingGroupName(bookingId));
    }

    public async Task UpdateLocation(Guid bookingId, double latitude, double longitude)
    {
        var (senderId, role) = GetCallerIdentity(Context.User);
        await Clients.OthersInGroup(BookingGroupName(bookingId)).SendAsync("ReceiveLocation", new
        {
            BookingId = bookingId,
            SenderId = senderId,
            Role = role,
            Latitude = latitude,
            Longitude = longitude,
            UpdatedAt = DateTime.UtcNow
        });
    }

    private static string BookingGroupName(Guid bookingId) => $"booking-loc-{bookingId:N}";

    private static (Guid senderId, string senderRole) GetCallerIdentity(ClaimsPrincipal? user)
    {
        if (user is null) throw new HubException("Unauthenticated.");
        var role = user.FindFirst(ClaimTypes.Role)?.Value ?? throw new HubException("Missing role claim.");
        var idClaim = role switch
        {
            "customer" => user.FindFirst("customer_id")?.Value,
            "photographer" => user.FindFirst("photographer_id")?.Value,
            "staff" => user.FindFirst("staff_id")?.Value,
            "admin" => user.FindFirst("staff_id")?.Value ?? user.FindFirst("admin_id")?.Value,
            _ => null
        };
        if (!Guid.TryParse(idClaim, out var senderId)) throw new HubException($"Missing {role}_id claim.");
        return (senderId, role);
    }
}
