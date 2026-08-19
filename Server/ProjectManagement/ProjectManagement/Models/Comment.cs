namespace ProjectManagement.Models;

public class Comment
{
    public int Id { get; set; }
    public string Text { get; set; }
    public int TaskId { get; set; }
    public EntityTask Task { get; set; }

    public string UserId { get; set; }
    public User  User { get; set; }

    public DateTime CreatedAt { get; set; }
}
