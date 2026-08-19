using MediatR;
using Microsoft.AspNetCore.SignalR;
using ProjectManagement.Data;
using ProjectManagement.Features.Tasks.ManageFiles;
using ProjectManagement.Hubs;
using ProjectManagement.Models;
using System.Text.Json;

namespace ProjectManagement.Features.Notification.HandleTaskFileAdded;

public class HandleTaskFileAddedNotification : INotificationHandler<TaskFileAddedEvent>
{
    private readonly ApplicationDbContext context;
    private readonly IHubContext<NotificationHub> hubContext;

    public HandleTaskFileAddedNotification(ApplicationDbContext context, IHubContext<NotificationHub> hubContext)
    {
        this.context = context;
        this.hubContext = hubContext;
    }

    public async Task Handle(TaskFileAddedEvent notification, CancellationToken cancellationToken)
    {
        var propertiesJson = JsonSerializer.Serialize(new
        {
            TaskTitle = notification.TaskTitle,
            FileName = notification.FileName
        });

        var activity = new Activity
        {
            ProjectId = notification.ProjectId,
            ActorId = notification.ActorId,
            EntityId = notification.TaskId.ToString(),
            EntityType = "Task",
            ActionType = ActionType.TASK_FILE_ADDED,
            Properties = propertiesJson
        };

        context.Activities.Add(activity);

        var sysNotification = new Models.Notification
        {
            Activity = activity,
            NotificationType = NotificationType.TASK_FILE_ADDED,
            MessageTemplate = "notification.task.file_added"
        };
        context.Notifications.Add(sysNotification);

        var targetUserIds = notification.TaskMemberIds
            .Where(userId => userId != notification.ActorId)
            .Distinct()
            .ToList();

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
            "TaskFileAdded",
            new
            {
                message = "Task File Added",
                projectId = notification.ProjectId,
                taskId = notification.TaskId,
                taskTitle = notification.TaskTitle
            },
            cancellationToken
        );
    }
}