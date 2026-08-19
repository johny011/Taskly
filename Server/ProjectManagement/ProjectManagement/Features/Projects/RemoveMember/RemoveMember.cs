using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Features.Tasks;
using ProjectManagement.Hubs;
using System.Security.Claims;

namespace ProjectManagement.Features.Projects.RemoveMember;

public record RemoveMemberRequest(int ProjectId, string TargetUserId, string InitiatorUserId) : IRequest;

public class RemoveMemberHandler : IRequestHandler<RemoveMemberRequest>
{
    private readonly ApplicationDbContext context;
    private readonly IPublisher publisher;
    private readonly IHubContext<ProjectHub> projectHubContext;
    private readonly ITaskFileStorageService taskFileStorageService;
    private readonly IHubContext<ActivityHub> activityHubContext;

    public RemoveMemberHandler(ApplicationDbContext context, IPublisher publisher,
        IHubContext<ProjectHub> projectHubContext,
        ITaskFileStorageService taskFileStorageService,
        IHubContext<ActivityHub> activityHubContext)
    {
        this.context = context;
        this.publisher = publisher;
        this.projectHubContext = projectHubContext;
        this.taskFileStorageService = taskFileStorageService;
        this.activityHubContext = activityHubContext;
    }
    public async Task Handle(RemoveMemberRequest request, CancellationToken cancellationToken)
    {
        var project = await context.Projects
            .Include(p => p.ProjectMembers)
            .FirstOrDefaultAsync(p => p.Id == request.ProjectId, cancellationToken);



        if (project == null)
        {
            throw new Exception("Project not found");
        }

        var member = project.ProjectMembers.FirstOrDefault(m => m.UserId == request.TargetUserId);
        if (member == null)
        {
            throw new Exception("Member not found in the project");
        }

        var initiator = project.ProjectMembers.FirstOrDefault(m => m.UserId == request.InitiatorUserId);
        if (initiator == null)
        {
            throw new Exception("You are not a member of the project");
        }

        if (member.Role == ProjectManagement.Models.ProjectRole.Owner)
        {
            throw new UnauthorizedAccessException("Cannot remove the project owner");
        }

        if (initiator.Role == ProjectManagement.Models.ProjectRole.Manager)
        {
            if (member.Role != ProjectManagement.Models.ProjectRole.Member)
            {
                throw new UnauthorizedAccessException("Managers can only remove members");
            }
        }

        using var transaction = await context.Database.BeginTransactionAsync();
        try
        {
            await context.UserTasks
                .Where(ut => ut.UserId == member.UserId && ut.Task.ProjectId == request.ProjectId)
                .ExecuteDeleteAsync();
            await context.Comments
                .Where(c => c.UserId == member.UserId && c.Task.Project.Id == request.ProjectId)
                .ExecuteDeleteAsync();
            var files = await context.TaskFiles
                .Where(f => f.UserId == member.UserId && f.Task.Project.Id == request.ProjectId)
                .ToListAsync();

            foreach(var file in files)
            {
                await taskFileStorageService.DeleteTaskFileAsync(file.FilePath, cancellationToken);
            }
            context.RemoveRange(files);
            await context.SaveChangesAsync();

            await context.ProjectMembers
                .Where(pm => pm.UserId == member.UserId && pm.ProjectId == request.ProjectId)
                .ExecuteDeleteAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw new InvalidOperationException();
        }

        var targetedUser = await context.Users.FindAsync(request.TargetUserId);
        await publisher.Publish(new MemberRemovedFromProjectEvent(
            request.ProjectId, request.TargetUserId, request.InitiatorUserId,project.Title,targetedUser.FullName));

        await projectHubContext.Clients.Group($"project_{request.ProjectId}").SendAsync("ProjectMembersUpdated");
        await activityHubContext.Clients.Group($"activity_{request.ProjectId}").SendAsync("ProjectMembersUpdated");
    }
}

[Route("api/projects/{projectId}/members/{userId}")]
[ApiController]
[Authorize(Policy = "ProjectManagerOrOwner")]
public class RemoveMemberController : ControllerBase
{
    private readonly IMediator mediator;

    public RemoveMemberController(IMediator mediator)
    {
        this.mediator = mediator;
    }

    [HttpDelete]
    public async Task<ActionResult> RemoveMember(int projectId, string userId)
    {
        var initiatorId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        try
        {
            await mediator.Send(new RemoveMemberRequest(projectId, userId, initiatorId));
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
}