namespace ProjectManagement.Models;

public class TaskFiles
{
    public int Id { get; set; }
    public string FilePath { get; set; }
    public int TaskId { get; set; }
    public EntityTask Task { get; set; }
    
    public string UserId { get; set; }
    public User User { get; set; }
    public string FileName { get; set; }
}
