using Microsoft.AspNetCore.SignalR;

namespace ProjectManagement.Hubs;

public class TaskHub:Hub
{
    public async Task JoinTaskGroup(string TaskId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"task_{TaskId}");
    }
    public async Task LeaveTaskGroup(string TaskId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"task_{TaskId}");
    }
}
