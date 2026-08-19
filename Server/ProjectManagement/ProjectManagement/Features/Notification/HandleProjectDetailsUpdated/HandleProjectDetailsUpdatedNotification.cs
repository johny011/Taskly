using MediatR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Features.Projects.UpdateDetails;
using ProjectManagement.Hubs;
using ProjectManagement.Models;
using System.Text.Json;

namespace ProjectManagement.Features.Notification.HandleProjectDetailsUpdated;

public class HandleProjectDetailsUpdatedNotification : INotificationHandler<ProjectDetailsUpdatedEvent>
{
    private readonly ApplicationDbContext context;
    private readonly IHubContext<NotificationHub> hubContext;

    public HandleProjectDetailsUpdatedNotification(ApplicationDbContext context,
        IHubContext<NotificationHub> hubContext)
    {
        this.context = context;
        this.hubContext = hubContext;
    }
    public async Task Handle(ProjectDetailsUpdatedEvent notification, CancellationToken cancellationToken)
    {
        var propertiesJson = JsonSerializer.Serialize(new
        {
            Title = notification.ProjectTitle
        });

        var activity = new Activity
        {
            ProjectId = notification.ProjectId,
            ActorId = notification.ActorId,
            EntityId = notification.ProjectId.ToString(),
            EntityType = "Project",
            ActionType = ActionType.PROJECT_UPDATED,
            Properties = propertiesJson
        };

        context.Activities.Add(activity);

        var sysNotification = new Models.Notification
        {
            Activity = activity,
            NotificationType = NotificationType.PROJECT_UPDATED,
            MessageTemplate = "notification.project.updated"
        };
        context.Notifications.Add(sysNotification);

        var targetUserIds = await context.ProjectMembers
            .AsNoTracking()
            .Where(pm => pm.ProjectId == notification.ProjectId && pm.UserId != notification.ActorId)
            .Select(pm => pm.UserId)
            .ToListAsync(cancellationToken);

        if (!targetUserIds.Any())
        {
            await context.SaveChangesAsync(cancellationToken);
            return;
        }

        // 5. إنشاء الإشعارات وتمريرها للقائمة
        var userNotifications = targetUserIds.Select(userId => new UserNotification
        {
            Notification = sysNotification,
            UserId = userId,
            IsRead = false
        }).ToList();

        context.UserNotifications.AddRange(userNotifications);
        await context.SaveChangesAsync(cancellationToken);


        await hubContext.Clients.Users(targetUserIds).SendAsync(
            "ProjectUpdated",
            new
            {
                message = "Project Updated",
                projectId = notification.ProjectId,
                title = notification.ProjectTitle
            },
            cancellationToken
        );
    }
}
