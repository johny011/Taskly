namespace ProjectManagement.Models;

public class ProjectManagers
{
    public User Manager { get; set; }
    public string ManagerId { get; set; }
    public Project Project { get; set; }
    public int ProjectId { get; set; }
}
