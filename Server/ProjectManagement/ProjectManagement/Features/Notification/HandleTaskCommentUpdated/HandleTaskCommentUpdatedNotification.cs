using MediatR;
using Microsoft.AspNetCore.SignalR;
using ProjectManagement.Data;
using ProjectManagement.Features.Tasks.UpdateComment;
using ProjectManagement.Hubs;
using ProjectManagement.Models;
using System.Text.Json;

namespace ProjectManagement.Features.Notification.HandleTaskCommentUpdated;

public class HandleTaskCommentUpdatedNotification : INotificationHandler<TaskCommentUpdatedEvent>
{
    private readonly ApplicationDbContext context;
    private readonly IHubContext<NotificationHub> hubContext;

    public HandleTaskCommentUpdatedNotification(ApplicationDbContext context, IHubContext<NotificationHub> hubContext)
    {
        this.context = context;
        this.hubContext = hubContext;
    }

    public async Task Handle(TaskCommentUpdatedEvent notification, CancellationToken cancellationToken)
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
            ActionType = ActionType.TASK_COMMENT_UPDATED,
            Properties = propertiesJson
        };

        context.Activities.Add(activity);

        var sysNotification = new Models.Notification
        {
            Activity = activity,
            NotificationType = NotificationType.TASK_COMMENT_UPDATED,
            MessageTemplate = "notification.task.comment_updated"
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
            "TaskCommentUpdated",
            new
            {
                message = "Task Comment Updated",
                projectId = notification.ProjectId,
                taskId = notification.TaskId,
                taskTitle = notification.TaskTitle
            },
            cancellationToken
        );
    }
}