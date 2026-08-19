using Microsoft.AspNetCore.SignalR;

public class ActivityHub:Hub
{
    public async Task JoinActivityGroup(string projectId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"activity_{projectId}");
    }

    public async Task LeaveActivityGroup(string projectId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"activity_{projectId}");
    }
}