using MediatR;
using Microsoft.AspNetCore.SignalR;
using ProjectManagement.Data;
using ProjectManagement.Features.Tasks.UpdateTaskPosition;
using ProjectManagement.Hubs;
using ProjectManagement.Models;
using System.Text.Json;

namespace ProjectManagement.Features.Notification.HandleTaskMoved;

public class HandleTaskMovedNotification : INotificationHandler<TaskMovedEvent>
{
    private readonly ApplicationDbContext context;
    private readonly IHubContext<NotificationHub> hubContext;

    public HandleTaskMovedNotification(ApplicationDbContext context, IHubContext<NotificationHub> hubContext)
    {
        this.context = context;
        this.hubContext = hubContext;
    }

    public async Task Handle(TaskMovedEvent notification, CancellationToken cancellationToken)
    {
        var propertiesJson = JsonSerializer.Serialize(new
            {
                NewStatus = notification.Task.Status.ToString(),
                TaskTitle = notification.Task.Text
            }
        );

        var activity = new Activity
        {
            ProjectId = notification.ProjectId,
            ActorId = notification.ActorId,
            EntityId = notification.Task.Id.ToString(),
            EntityType = "Task",
            ActionType = ActionType.TASK_MOVED,
            Properties = propertiesJson
        };

        context.Activities.Add(activity);

        var sysNotification = new Models.Notification
        {
            Activity = activity,
            NotificationType = NotificationType.TASK_MOVED,
            MessageTemplate = "notification.task.moved"
        };
        context.Notifications.Add(sysNotification);

        var targetUsers = notification.Task.Members
            .Where(user => user.Id != notification.ActorId)
            .ToList();

        if (!targetUsers.Any())
        {
            await context.SaveChangesAsync(cancellationToken);
            return;
        }

        var userNotifications = new List<UserNotification>();
        foreach (var user in targetUsers)
        {
            userNotifications.Add(new UserNotification
            {
                Notification = sysNotification,
                UserId = user.Id,
                IsRead = false
            });
        }

        context.UserNotifications.AddRange(userNotifications);
        await context.SaveChangesAsync(cancellationToken);


        var targetUserIds = targetUsers.Select(u => u.Id).ToList();

        await hubContext.Clients.Users(targetUserIds).SendAsync(
            "TaskMoved",
            new
            {
                message = "Task Moved",
                projectId = notification.ProjectId,
                taskId = notification.Task.Id
            },
            cancellationToken
        );
    }
}