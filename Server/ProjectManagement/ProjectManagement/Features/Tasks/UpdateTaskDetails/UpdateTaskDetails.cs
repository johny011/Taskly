using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Features.Tasks.UpdateTaskDetails;
using ProjectManagement.Hubs;
using ProjectManagement.Models;
using System.Security.Claims;

namespace ProjectManagement.Features.Tasks;

public record UpdateTaskDetailsCommand(int ProjectId, int TaskId, string Text, string? Description) : IRequest;

public class UpdateTaskDetailsValidator : AbstractValidator<UpdateTaskDetailsCommand>
{
    public UpdateTaskDetailsValidator()
    {
        RuleFor(x => x.Text)
            .NotEmpty()
            .MaximumLength(4000);

        RuleFor(x => x.Description)
            .MaximumLength(10000);
    }
}

public class UpdateTaskDetailsCommandHandler : IRequestHandler<UpdateTaskDetailsCommand>
{
    private readonly ApplicationDbContext _context;
    private readonly IHubContext<ProjectHub> projectHub;
    private readonly IHubContext<TaskHub> taskHub;
    private readonly IHubContext<ActivityHub> activityHub;
    private readonly IHttpContextAccessor httpContextAccessor;
    private readonly IPublisher publisher;

    public UpdateTaskDetailsCommandHandler(ApplicationDbContext context,
        IHubContext<ProjectHub> projectHub,
        IHubContext<TaskHub> taskHub,
        IHubContext<ActivityHub> activityHub,
        IHttpContextAccessor httpContextAccessor,
        IPublisher publisher)
    {
        _context = context;
        this.projectHub = projectHub;
        this.taskHub = taskHub;
        this.activityHub = activityHub;
        this.httpContextAccessor = httpContextAccessor;
        this.publisher = publisher;
    }

    public async Task Handle(UpdateTaskDetailsCommand request, CancellationToken cancellationToken)
    {
        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == request.TaskId && t.ProjectId == request.ProjectId, cancellationToken);

        if (task == null)
            throw new KeyNotFoundException("Task not found.");

        string taskTitle = task.Text;
        var taskMembersQuery = _context.UserTasks
            .AsNoTracking()
            .Where(ut => ut.TaskId == request.TaskId)
            .Select(ut => ut.UserId);

        var projectManagersQuery = _context.ProjectMembers
            .AsNoTracking()
            .Where(pm => pm.ProjectId == request.ProjectId && pm.Role != ProjectRole.Member)
            .Select(pm => pm.UserId);

        var taskMembersIds = await taskMembersQuery
            .Union(projectManagersQuery)
            .ToListAsync();

        task.Text = request.Text.Trim();
        task.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();

        await _context.SaveChangesAsync(cancellationToken);


        var actorId = httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);

        await publisher.Publish(new TaskUpdatedEvent(request.ProjectId, request.TaskId,taskTitle, actorId, taskMembersIds));
        await projectHub.Clients.Group($"project_{request.ProjectId}").SendAsync("TaskInfoUpdated", task);
        await taskHub.Clients.Group($"task_{request.TaskId}").SendAsync("TaskUpdated");
        await activityHub.Clients.Group($"project_{request.ProjectId}").SendAsync("TaskUpdated");

    }
}

public record UpdateTaskDetailsRequest(string Text, string? Description);

[ApiController]
[Route("api/projects/{projectId}/tasks/{taskId}")]
[Authorize(Policy = "TaskManagerOrOwner")]
public class UpdateTaskDetailsController : ControllerBase
{
    private readonly IMediator _mediator;

    public UpdateTaskDetailsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPatch]
    public async Task<IActionResult> Update(int projectId, int taskId, [FromBody] UpdateTaskDetailsRequest request)
    {
        try
        {
            await _mediator.Send(new UpdateTaskDetailsCommand(projectId, taskId, request.Text, request.Description));
            return NoContent();
        }
        catch (ValidationException e)
        {
            return BadRequest(new { Message = e.Message });
        }
        catch (KeyNotFoundException e)
        {
            return NotFound(new { Message = e.Message });
        }
    }
}
