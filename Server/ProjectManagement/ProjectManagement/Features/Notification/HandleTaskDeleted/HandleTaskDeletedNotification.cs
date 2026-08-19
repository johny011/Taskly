using MediatR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Features.Tasks.DeleteTaskById;
using ProjectManagement.Hubs;
using ProjectManagement.Models;
using System.Text.Json;

namespace ProjectManagement.Features.Notification.HandleTaskDeleted;

public class HandleTaskDeletedNotification : INotificationHandler<TaskDeletedEvent>
{
    private readonly ApplicationDbContext context;
    private readonly IHubContext<NotificationHub> hubContext;

    public HandleTaskDeletedNotification(ApplicationDbContext context, IHubContext<NotificationHub> hubContext)
    {
        this.context = context;
        this.hubContext = hubContext;
    }

    public async Task Handle(TaskDeletedEvent notification, CancellationToken cancellationToken)
    {
        var propertiesJson = JsonSerializer.Serialize(new
        {
            TaskTitle = notification.TaskTitle
        });

        var activity = new Activity
        {
            ProjectId = notification.ProjectId,
            ActorId = notification.ActorId,
            EntityId = notification.TaskId.ToString(),
            EntityType = "Task",
            ActionType = ActionType.TASK_DELETED,
            Properties = propertiesJson
        };

        context.Activities.Add(activity);

        var sysNotification = new Models.Notification
        {
            Activity = activity,
            NotificationType = NotificationType.TASK_DELETED,
            MessageTemplate = "notification.task.deleted"
        };
        context.Notifications.Add(sysNotification);

        var targetUserIds = notification.TaskMemberIds.Where(tm => tm != notification.ActorId).ToList();

        if (!targetUserIds.Any())
        {
            await context.SaveChangesAsync(cancellationToken);
            return;
        }

        var userNotifications = targetUserIds.Select(userId => new UserNotification
        {
            Notification = sysNotification,
            UserId = userId,
            IsRead = false
        }).ToList();

        context.UserNotifications.AddRange(userNotifications);
        await context.SaveChangesAsync(cancellationToken);

        
        await hubContext.Clients.Users(targetUserIds).SendAsync(
            "TaskDeleted",
            new
            {
                message = "Task Deleted",
                projectId = notification.ProjectId,
                taskId = notification.TaskId,
                taskTitle = notification.TaskTitle
            },
            cancellationToken
        );
    }
}