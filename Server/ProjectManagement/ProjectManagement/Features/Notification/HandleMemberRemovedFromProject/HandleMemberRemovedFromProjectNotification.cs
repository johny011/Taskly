using MediatR;
using Microsoft.AspNetCore.SignalR;
using ProjectManagement.Data;
using ProjectManagement.Features.Projects.RemoveMember;
using ProjectManagement.Hubs;
using ProjectManagement.Models;
using System.Text.Json;

namespace ProjectManagement.Features.Notification.HandleMemberRemovedFromProject;

public class HandleMemberRemovedFromProjectNotification : INotificationHandler<MemberRemovedFromProjectEvent>
{
    private readonly ApplicationDbContext context;
    private readonly IHubContext<NotificationHub> hubContext;
    public HandleMemberRemovedFromProjectNotification(ApplicationDbContext context, IHubContext<NotificationHub> hubContext)
    {
        this.context = context;
        this.hubContext = hubContext;
    }
    
        
    public async Task Handle(MemberRemovedFromProjectEvent notification, CancellationToken cancellationToken)
    {
        var properties = JsonSerializer.Serialize(new
        {
            ProjectTitle = notification.ProjectTitle,
            RemovedUserId = notification.UserId,
            MemberName = notification.UserName
        });
        var activity = new Activity
        {
            ProjectId = notification.ProjectId,
            ActorId = notification.ActorId,
            EntityId = notification.ProjectId.ToString(),
            EntityType = "Project",
            ActionType = ActionType.MEMBER_REMOVED,
            Properties = properties
        };

        context.Activities.Add(activity);

        var sysNotification = new Models.Notification
        {
            Activity = activity,
            NotificationType = NotificationType.PROJECT_REMOVAL,
            MessageTemplate = "notification.project.removed_you"
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

        await hubContext.Clients.User(notification.UserId.ToString()).SendAsync(
            "RemovedFromProject",
            new { message = "You have been removed from project", projectId = notification.ProjectId },
            cancellationToken
        );
    }
}
