namespace ProjectManagement.Models;

public class UserNotification
{
    public Guid Id { get; set; }
    public string UserId { get; set; }
    public Guid NotificationId { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }

    // Navigation Properties
    public Notification Notification { get; set; } = null!;
}