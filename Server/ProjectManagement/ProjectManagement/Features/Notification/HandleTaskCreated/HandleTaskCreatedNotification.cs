using MediatR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Features.Tasks.Create;
using ProjectManagement.Hubs;
using ProjectManagement.Models;
using System.Text.Json;

namespace ProjectManagement.Features.Notification.HandleTaskCreated;

public class HandleTaskCreatedNotification : INotificationHandler<TaskCreatedEvent>
{
    private readonly ApplicationDbContext context;
    private readonly IHubContext<NotificationHub> hubContext;

    public HandleTaskCreatedNotification(ApplicationDbContext context, IHubContext<NotificationHub> hubContext)
    {
        this.context = context;
        this.hubContext = hubContext;
    }

    public async Task Handle(TaskCreatedEvent notification, CancellationToken cancellationToken)
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
            ActionType = ActionType.TASK_CREATED,
            Properties = propertiesJson
        };

        context.Activities.Add(activity);

        var sysNotification = new Models.Notification
        {
            Activity = activity,
            NotificationType = NotificationType.TASK_CREATED,
            MessageTemplate = "notification.task.created"
        };
        context.Notifications.Add(sysNotification);

        var targetUserIds = await context.ProjectMembers
            .AsNoTracking()
            .Where(pm => pm.ProjectId == notification.ProjectId && pm.UserId != notification.ActorId && pm.Role != ProjectRole.Member)
            .Select(pm => pm.UserId)
            .ToListAsync(cancellationToken);

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
            "TaskCreated",
            new
            {
                message = "Task Created",
                projectId = notification.ProjectId,
                taskId = notification.TaskId,
                taskTitle = notification.TaskTitle
            },
            cancellationToken
        );
    }
}