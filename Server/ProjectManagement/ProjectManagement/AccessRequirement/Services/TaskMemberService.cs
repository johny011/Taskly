using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;

namespace ProjectManagement.AccessRequirement.Services;

public interface ITaskMemberService
{
    Task<bool> IsMember(string userId, int taskId);
}
public class TaskMemberService : ITaskMemberService
{
    private readonly ApplicationDbContext context;

    public TaskMemberService(ApplicationDbContext context)
    {
        this.context = context;
    }
    public async Task<bool> IsMember(string userId, int taskId)
    {
        var isMember = await this.context.Tasks
            .AnyAsync(t => t.Id == taskId && t.Members.Any(m => m.Id == userId));
        return isMember;
    }
}
