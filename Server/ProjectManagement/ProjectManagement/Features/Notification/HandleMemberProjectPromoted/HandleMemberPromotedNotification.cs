using MediatR;
using Microsoft.AspNetCore.SignalR;
using ProjectManagement.Data;
using ProjectManagement.Features.Projects.PromoteMember;
using ProjectManagement.Hubs;
using ProjectManagement.Models;
using System.Text.Json;

namespace ProjectManagement.Features.Notification.HandleMemberProjectPromoted;

public class HandleMemberPromotedNotification : INotificationHandler<MemberPromotedEvent>
{
    private readonly ApplicationDbContext context;
    private readonly IHubContext<NotificationHub> niotificationHub;

    public HandleMemberPromotedNotification(ApplicationDbContext context,
        IHubContext<NotificationHub> niotificationHub)
    {
        this.context = context;
        this.niotificationHub = niotificationHub;
    }
    public async Task Handle(MemberPromotedEvent notification, CancellationToken cancellationToken)
    {
        var properties = JsonSerializer.Serialize(new
        {
            ProjectTitle = notification.ProjectTitle,
            NewRole = notification.Role.ToString(),
            MemberName = notification.UserName
        });
        var activity = new Activity
        {
            ActionType = ActionType.MEMBER_ROLE_CHANGED,
            EntityType = "Project",
            ActorId = notification.ActorId,
            ProjectId = notification.ProjectId,
            EntityId = notification.ProjectId.ToString(),
            Properties = properties
        };

        context.Activities.Add(activity);


        var sysNotification = new Models.Notification
        {
            Activity = activity,
            NotificationType = NotificationType.MEMBER_ROLE_UPDATED,
            MessageTemplate = "notification.task.role_updated"
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
            .SendAsync("RoleChanged",
            new { message = "Your role has been changed", projectId = notification.ProjectId },
            cancellationToken);
    }
}

