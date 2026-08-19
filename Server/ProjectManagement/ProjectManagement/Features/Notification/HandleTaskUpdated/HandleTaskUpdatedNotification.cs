using MediatR;
using Microsoft.AspNetCore.SignalR;
using ProjectManagement.Data;
using ProjectManagement.Features.Tasks.UpdateTaskDetails;
using ProjectManagement.Hubs;
using ProjectManagement.Models;
using System.Text.Json;

namespace ProjectManagement.Features.Notification.HandleTaskUpdated;

public class HandleTaskUpdatedNotification : INotificationHandler<TaskUpdatedEvent>
{
    private readonly ApplicationDbContext context;
    private readonly IHubContext<NotificationHub> hubContext;

    public HandleTaskUpdatedNotification(ApplicationDbContext context, IHubContext<NotificationHub> hubContext)
    {
        this.context = context;
        this.hubContext = hubContext;
    }

    public async Task Handle(TaskUpdatedEvent notification, CancellationToken cancellationToken)
    {
        // 1. حفظ عنوان المهمة في الـ Properties لاستخدامه في نص الإشعار
        var propertiesJson = JsonSerializer.Serialize(new
        {
            TaskTitle = notification.TaskTitle
        });

        // 2. إنشاء كائن الـ Activity
        var activity = new Activity
        {
            ProjectId = notification.ProjectId,
            ActorId = notification.ActorId,
            EntityId = notification.TaskId.ToString(),
            EntityType = "Task",
            ActionType = ActionType.TASK_DETAILS_UPDATED,
            Properties = propertiesJson
        };

        context.Activities.Add(activity);

        var sysNotification = new Models.Notification
        {
            Activity = activity,
            NotificationType = NotificationType.TASK_UPDATED,
            MessageTemplate = "notification.task.updated"
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
            "TaskUpdated",
            new
            {
                message = "Task Updated",
                projectId = notification.ProjectId,
                taskId = notification.TaskId,
                taskTitle = notification.TaskTitle
            },
            cancellationToken
        );
    }
}