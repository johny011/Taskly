using System.Diagnostics;

namespace ProjectManagement.Models;

public class Notification
{
    public Guid Id { get; set; }
    public Guid? ActivityId { get; set; }
    public NotificationType NotificationType { get; set; }
    public string MessageTemplate { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    // Navigation Properties
    public Activity? Activity { get; set; }
    public ICollection<UserNotification> UserNotifications { get; set; } = new List<UserNotification>();
}

public enum NotificationType
{
    PROJECT_UPDATED,
    PROJECT_INVITATION,
    PROJECT_REMOVAL,
    MEMBER_ROLE_UPDATED,
    TASK_CREATED,
    TASK_DELETED,
    TASK_UPDATED,
    TASK_MOVED,
    TASK_ASSIGNED,
    TASK_UNASSIGNED,
    TASK_COMMENT_ADDED,
    TASK_COMMENT_UPDATED,
    TASK_COMMENT_DELETED,
    TASK_FILE_ADDED,
    TASK_FILE_DELETED
}