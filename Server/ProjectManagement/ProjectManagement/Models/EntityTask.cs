namespace ProjectManagement.Models;

public class EntityTask
{
    public int Id { get; set; }
    public string Text { get; set; }
    public string? Description { get; set; }
    public Project Project { get; set; }
    public int ProjectId { get; set; }
    public EntityTaskStatus Status { get; set; } = EntityTaskStatus.ToDo;
    public DateTime? CreatedAt { get; set; }
    public string Rank { get; set; } = "0|h00000:"; // Changed from double to string, set Lexorank default

    public ICollection<User> Members { get; set; }
    public ICollection<TaskFiles> Files { get; set; }
    public ICollection<Comment> Comments { get; set; }

}
public enum EntityTaskStatus
{
    ToDo,
    InProgress,
    Done
}
