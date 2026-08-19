using System.Text.Json;
using MediatR;
using Microsoft.AspNetCore.SignalR;
using ProjectManagement.Data;
using ProjectManagement.Features.Tasks.ManageMembers;
using ProjectManagement.Hubs;
using ProjectManagement.Models;

namespace ProjectManagement.Features.Notification.HandleMemberAddedToTask;

public class HandleMemberAddedToTaskNotification : INotificationHandler<MemberAddedToTaskEvent>
{
    private readonly ApplicationDbContext context;
    private readonly IHubContext<NotificationHub> hubContext;

    public HandleMemberAddedToTaskNotification(ApplicationDbContext context,
        IHubContext<NotificationHub> hubContext)
    {
        this.context = context;
        this.hubContext = hubContext;
    }
    public async Task Handle(MemberAddedToTaskEvent notification, CancellationToken cancellationToken)
    {
        var proerties = JsonSerializer.Serialize(new
        {
            MemberId = notification.UserId,
            TaskTitle = notification.TaskTitle,
            MemberName = notification.MemberName
            
        });

        var activity = new Activity
        {
            ActionType=ActionType.TASK_ASSIGNEE_ADDED,
            EntityType = "Task",
            ActorId = notification.ActorId,
            ProjectId = notification.ProjectId,
            EntityId = notification.TaskId.ToString(),
            Properties = proerties,
        };

        context.Activities.Add(activity);


        var sysNotification = new Models.Notification
        {
            Activity = activity, 
            NotificationType = NotificationType.TASK_ASSIGNED,
            MessageTemplate = "notification.task.assigned_you"
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
        await hubContext.Clients.User(notification.UserId.ToString())
            .SendAsync("AssignedToTask",
            new { message = "تم تكليفك بمهمة جديدة", taskId = notification.TaskId,projectId = notification.ProjectId },
            cancellationToken);
    }
}
