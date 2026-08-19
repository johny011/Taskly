namespace ProjectManagement.Models;

public class Activity
{
    public Guid Id { get; set; }
    public int ProjectId { get; set; }
    public Project Project { get; set; }
    public string ActorId { get; set; }
    public User Actor { get; set; }
    public ActionType ActionType { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty; // يفضل تركه string ليدعم أي نوع معرف مستقبلاً
    public string? Properties { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation Properties
    public Notification? Notification { get; set; }
}

public enum ActionType
{
    PROJECT_UPDATED,
    MEMBER_ADDED,
    MEMBER_REMOVED,
    MEMBER_ROLE_CHANGED,

    TASK_CREATED,
    TASK_DELETED,
    TASK_DETAILS_UPDATED,
    TASK_MOVED,

    TASK_ASSIGNEE_ADDED,
    TASK_ASSIGNEE_REMOVED,
    TASK_FILE_ADDED,
    TASK_FILE_DELETED,
    TASK_COMMENT_ADDED,
    TASK_COMMENT_UPDATED,
    TASK_COMMENT_DELETED
}