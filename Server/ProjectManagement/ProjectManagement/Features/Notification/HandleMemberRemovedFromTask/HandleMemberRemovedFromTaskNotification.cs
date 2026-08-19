using MediatR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Features.Tasks.ManageMembers;
using ProjectManagement.Hubs;
using ProjectManagement.Models;
using System.Text.Json;

namespace ProjectManagement.Features.Notification.HandleMemberRemovedFromTask;

public class HandleMemberRemovedFromTaskNotification : INotificationHandler<MemberRemovedFromTaskEvent>
{
    private readonly ApplicationDbContext context;
    private readonly IHubContext<NotificationHub> niotificationHub;

    public HandleMemberRemovedFromTaskNotification(ApplicationDbContext context,
        IHubContext<NotificationHub> niotificationHub
        )
    {
        this.context = context;
        this.niotificationHub = niotificationHub;
    }
    public async Task Handle(MemberRemovedFromTaskEvent notification, CancellationToken cancellationToken)
    {
        var proerties = JsonSerializer.Serialize(new
        {
            MemberId = notification.UserId,
            TaskTitle = notification.TaskTitle,
            MemberName = notification.MemberName

        });

        var activity = new Activity
        {
            ActionType = ActionType.TASK_ASSIGNEE_REMOVED,
            EntityType = "Task",
            ActorId = notification.ActorId,
            ProjectId = notification.ProjectId,
            EntityId = notification.TaskId.ToString(),
            Properties = proerties
        };

        context.Activities.Add(activity);


        var sysNotification = new Models.Notification
        {
            Activity = activity,
            NotificationType = NotificationType.TASK_UNASSIGNED,
            MessageTemplate = "notification.task.removed_you"
        };
        context.Notifications.Add(sysNotification);

        var userNotification = new UserNotification
        {
            Notification = sysNotification,
            UserId = notification.UserId,
            IsRead = false
        };
        context.UserNotifications.Add(userNotification);


        await context.SaveChangesAsync(cancellationToken);
        await niotificationHub.Clients.User(notification.UserId.ToString())
            .SendAsync("RemovedFromTask",
            new { message = "تم حذفك من المهمة", taskId = notification.TaskId, projectId = notification.ProjectId },
            cancellationToken);
    }
}
