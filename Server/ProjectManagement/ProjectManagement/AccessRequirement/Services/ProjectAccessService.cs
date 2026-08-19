using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Models;

namespace ProjectManagement.AccessRequirement.Services;

public interface IProjectAccessService
{
    Task<ProjectRole?> GetUserRole(string userId, int projectId);
    Task<bool> IsOwner(string userId, int projectId);
    Task<bool> IsManager(string userId, int projectId);
    Task<bool> IsMember(string userId, int projectId);
}

public class ProjectAccessService : IProjectAccessService
{
    private readonly ApplicationDbContext _context;

    public ProjectAccessService(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Gets the project role of the user for a given project.
    /// Returns null if the user is not a member of the project.
    /// </summary>
    public async Task<ProjectRole?> GetUserRole(string userId, int projectId)
    {
        var projectMember = await _context.ProjectMembers
            .FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
        
        return projectMember?.Role;
    }

    /// <summary>
    /// Returns true if the user is an Owner of the project.
    /// </summary>
    public async Task<bool> IsOwner(string userId, int projectId)
    {
        return await _context.ProjectMembers
            .AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId && pm.Role == ProjectRole.Owner);
    }

    /// <summary>
    /// Returns true if the user is an Owner or Manager of the project.
    /// </summary>
    public async Task<bool> IsManager(string userId, int projectId)
    {
        return await _context.ProjectMembers
            .AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId 
                && (pm.Role == ProjectRole.Owner || pm.Role == ProjectRole.Manager));
    }

    /// <summary>
    /// Returns true if the user is a member of the project regardless of role.
    /// </summary>
    public async Task<bool> IsMember(string userId, int projectId)
    {
        return await _context.ProjectMembers
            .AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
    }
}
