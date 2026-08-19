using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Features.Tasks.ManageMembers;
using ProjectManagement.Hubs;
using System.Security.Claims;

namespace ProjectManagement.Features.Tasks;

public record AddTaskMembersCommand(int ProjectId, int TaskId, List<string> UserIds) : IRequest;

public class AddTaskMembersCommandHandler : IRequestHandler<AddTaskMembersCommand>
{
    private readonly ApplicationDbContext _context;
    private readonly IHubContext<TaskHub> taskHubContext;
    private readonly IPublisher publisher;
    private readonly IHttpContextAccessor httpContextAccessor;
    private readonly IHubContext<ActivityHub> activityHubContext;

    public AddTaskMembersCommandHandler(ApplicationDbContext context,
        IHubContext<TaskHub> taskHubContext,
        IPublisher publisher,
        IHttpContextAccessor httpContextAccessor,
        IHubContext<ActivityHub> activityHubContext)
    {
        _context = context;
        this.taskHubContext = taskHubContext;
        this.publisher = publisher;
        this.httpContextAccessor = httpContextAccessor;
        this.activityHubContext = activityHubContext;
    }

    public async Task Handle(AddTaskMembersCommand request, CancellationToken cancellationToken)
    {
        var task = await _context.Tasks
            .Include(t => t.Members)
            .FirstOrDefaultAsync(t => t.Id == request.TaskId && t.ProjectId == request.ProjectId, cancellationToken);

        if (task == null)
            throw new KeyNotFoundException("Task not found.");

        var normalizedUserIds = request.UserIds
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Select(id => id.Trim())
            .Distinct()
            .ToList();

        if (!normalizedUserIds.Any())
            return;

        var allowedProjectMemberIds = await _context.ProjectMembers
            .Where(pm => pm.ProjectId == request.ProjectId && normalizedUserIds.Contains(pm.UserId))
            .Select(pm => pm.UserId)
            .ToListAsync(cancellationToken);

        var existingTaskMemberIds = task.Members
            .Select(m => m.Id)
            .ToHashSet();

        var toAddIds = allowedProjectMemberIds
            .Where(id => !existingTaskMemberIds.Contains(id))
            .ToList();

        if (!toAddIds.Any())
            return;

        var users = await _context.Users
            .Where(u => toAddIds.Contains(u.Id))
            .ToListAsync(cancellationToken);

        foreach (var user in users)
        {
            task.Members.Add(user);
        }

        await _context.SaveChangesAsync(cancellationToken);
        foreach (var user in users)
            await publisher.Publish(new MemberAddedToTaskEvent
            (
                user.Id,
                request.ProjectId,
                request.TaskId,
                httpContextAccessor.HttpContext.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)!.Value,
                task.Text,
                user.FullName
            ));
        await taskHubContext.Clients.Group($"task_{request.TaskId}").SendAsync("TaskMembersUpdated");
        await activityHubContext.Clients.Group($"activity_{request.ProjectId}").SendAsync("TaskMembersUpdated");
    }
}

public record RemoveTaskMemberCommand(int ProjectId, int TaskId, string UserId) : IRequest;

public class RemoveTaskMemberCommandHandler : IRequestHandler<RemoveTaskMemberCommand>
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor accessor;
    private readonly IHubContext<TaskHub> taskHub;
    private readonly IPublisher publisher;
    private readonly IHubContext<ActivityHub> activityHubContext;

    public RemoveTaskMemberCommandHandler(ApplicationDbContext context,
        IHttpContextAccessor accessor,
        IHubContext<TaskHub> taskHub,
        IPublisher publisher,
        IHubContext<ActivityHub> activityHubContext)
    {
        _context = context;
        this.accessor = accessor;
        this.taskHub = taskHub;
        this.publisher = publisher;
        this.activityHubContext = activityHubContext;
    }

    public async Task Handle(RemoveTaskMemberCommand request, CancellationToken cancellationToken)
    {
        var task = await _context.Tasks
            .Include(t => t.Members)
            .FirstOrDefaultAsync(t => t.Id == request.TaskId && t.ProjectId == request.ProjectId, cancellationToken);

        if (task == null)
            throw new KeyNotFoundException("Task not found.");

        var member = task.Members.FirstOrDefault(m => m.Id == request.UserId);
        if (member == null)
            return;

        task.Members.Remove(member);
        await _context.SaveChangesAsync(cancellationToken);
        await publisher.Publish(new MemberRemovedFromTaskEvent(
            request.UserId,
            accessor.HttpContext.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier).Value,
            request.ProjectId,
            request.TaskId,
            task.Text,
            member.FullName
            ));
        await taskHub.Clients.Group($"task_{request.TaskId}").SendAsync("TaskMembersUpdated");
        await activityHubContext.Clients.Groups($"activity_{request.ProjectId}").SendAsync("TaskMembersUpdated");
    }
}

[ApiController]
[Route("api/projects/{projectId}/tasks/{taskId}/members")]
[Authorize(Policy = "TaskManagerOrOwner")]
public class ManageTaskMembersController : ControllerBase
{
    private readonly IMediator _mediator;

    public ManageTaskMembersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("bulk")]
    public async Task<IActionResult> AddMembers(int projectId, int taskId, [FromBody] List<string> userIds)
    {
        await _mediator.Send(new AddTaskMembersCommand(projectId, taskId, userIds));
        return NoContent();
    }

    [HttpDelete("{userId}")]
    public async Task<IActionResult> RemoveMember(int projectId, int taskId, string userId)
    {
        await _mediator.Send(new RemoveTaskMemberCommand(projectId, taskId, userId));
        return NoContent();
    }
}
