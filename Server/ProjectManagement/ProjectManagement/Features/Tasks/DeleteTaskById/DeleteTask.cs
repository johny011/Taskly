using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Hubs;
using ProjectManagement.Models;
using System.Security.Claims;

namespace ProjectManagement.Features.Tasks.DeleteTaskById;

public record DeleteTaskCommand(int ProjectId, int TaskId) : IRequest;

public class DeleteTaskCommandHandler : IRequestHandler<DeleteTaskCommand>
{
    private readonly ApplicationDbContext context;
    private readonly IHubContext<ProjectHub> projectHub;
    private readonly IHubContext<ActivityHub> activityHub;
    private readonly IPublisher publisher;
    private readonly IHttpContextAccessor httpContextAccessor;

    public DeleteTaskCommandHandler(ApplicationDbContext context,
        IHubContext<ProjectHub> projectHub,
        IHubContext<ActivityHub> activityHub,
        IPublisher publisher,
        IHttpContextAccessor httpContextAccessor)
    {
        this.context = context;
        this.projectHub = projectHub;
        this.activityHub = activityHub;
        this.publisher = publisher;
        this.httpContextAccessor = httpContextAccessor;
    }

    public async Task Handle(DeleteTaskCommand request, CancellationToken cancellationToken)
    {
        var task = await context.Tasks.FindAsync(request.TaskId);
        if (task == null || task.ProjectId != request.ProjectId)
            throw new KeyNotFoundException("Task not found or does not belong to the specified project.");

        var actorId = httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var taskMembersQuery = context.UserTasks
            .AsNoTracking()
            .Where(ut => ut.TaskId == request.TaskId)
            .Select(ut => ut.UserId);

        var projectManagersQuery = context.ProjectMembers
            .AsNoTracking()
            .Where(pm => pm.ProjectId == request.ProjectId && pm.Role != ProjectRole.Member)
            .Select(pm => pm.UserId);

        var taskMembersIds = await taskMembersQuery
            .Union(projectManagersQuery)
            .ToListAsync(cancellationToken);

        context.Remove(task);
        await context.SaveChangesAsync(cancellationToken);
        await publisher.Publish(new TaskDeletedEvent(request.ProjectId, request.TaskId, task.Text, actorId, taskMembersIds));
        await projectHub.Clients.Group($"project_{request.ProjectId}").SendAsync("TaskDeleted", new { TaskId = request.TaskId });
        await activityHub.Clients.Group($"activity_{request.ProjectId}").SendAsync("TaskDeleted");
        
    }
}

[Route("api/projects/{projectId}/tasks")]
[Authorize(Policy = "ProjectManagerOrOwner")]
[ApiController]
public class DeleteTaskController : ControllerBase
{
    private readonly IMediator mediator;

    public DeleteTaskController(IMediator mediator)
    {
        this.mediator = mediator;
    }

    [HttpDelete("{taskId}")]
    public async Task<ActionResult> DeleteTask(int projectId, int taskId)
    {
        try
        {
            await mediator.Send(new DeleteTaskCommand(projectId, taskId));
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest();
        }
    }
}
