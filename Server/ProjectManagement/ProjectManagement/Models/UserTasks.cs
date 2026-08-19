namespace ProjectManagement.Models;

public class UserTasks
{
    public User User { get; set; }
    public string UserId { get; set; }
    public EntityTask Task { get; set; }
    public int TaskId { get; set; }

}
