namespace ProjectManagement.Models;

public class ProjectMember
{
    public int ProjectId { get; set; }
    public Project Project { get; set; }

    public string UserId { get; set; }
    public User User { get; set; }

    public ProjectRole Role { get; set; }
}
