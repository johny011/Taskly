using MediatR;
using Microsoft.AspNetCore.SignalR;
using ProjectManagement.Data;
using ProjectManagement.Features.Projects.AddMembers;
using ProjectManagement.Hubs;
using ProjectManagement.Models;

namespace ProjectManagement.Features.Notification.HandleMemberAddedToProject;

public class HandleMemberAddedToProjectNotification : INotificationHandler<MemberAddedToProjectEvent>
{
    private readonly ApplicationDbContext context;
    private readonly IHubContext<NotificationHub> hubContext;

    public HandleMemberAddedToProjectNotification(ApplicationDbContext context,IHubContext<NotificationHub> hubContext)
    {
        this.context = context;
        this.hubContext = hubContext;
    }
    public async Task Handle(MemberAddedToProjectEvent notification, CancellationToken cancellationToken)
    {
        var activity = new Activity
        {
            ProjectId = notification.ProjectId,
            ActorId = notification.ActorId,
            EntityId = notification.UserId,
            EntityType = "Member",
            ActionType = ActionType.MEMBER_ADDED,
            Properties = System.Text.Json.JsonSerializer.Serialize(new
            {
                AddedUserId = notification.UserId,
                MemberName = notification.MemberName
            })
        };

        context.Activities.Add(activity);

        var sysNotification = new Models.Notification
        {
            Activity = activity,
            NotificationType = NotificationType.PROJECT_INVITATION,
            MessageTemplate = "notification.project.invited_you"
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

        await hubContext.Clients.User(notification.UserId).SendAsync(
            "AddedToProject",
            new { message = "تمت إضافتك إلى مشروع جديد", projectId = notification.ProjectId },
            cancellationToken
        );
    }
}
