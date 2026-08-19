using Microsoft.AspNetCore.SignalR;
using System.IdentityModel.Tokens.Jwt;

namespace ProjectManagement.Hubs;

public class CustomUserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection)
    {
        // قراءة حقل الـ sub أو الـ NameIdentifier من الـ User Claims القادم من التوكن
        return connection.User?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
               ?? connection.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    }
}
