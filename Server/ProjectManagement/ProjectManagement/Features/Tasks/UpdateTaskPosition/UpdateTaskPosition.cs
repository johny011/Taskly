using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Models;
using MediatR;
using ProjectManagement.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using ProjectManagement.Hubs;
using ProjectManagement.Features.Tasks.UpdateTaskPosition;
using System.Security.Claims;

namespace ProjectManagement.Features.Tasks;

// 1. DTO
public record UpdateTaskPositionCommand(
    int TaskId,
    int? PreviousTaskId,
    int? NextTaskId,
    EntityTaskStatus NewStatus) : IRequest;

// 2. Validator
public class UpdateTaskPositionValidator : AbstractValidator<UpdateTaskPositionCommand>
{
    public UpdateTaskPositionValidator()
    {
        RuleFor(x => x.TaskId).NotEmpty();
    }
}

public class UpdateTaskPositionCommandHandler : IRequestHandler<UpdateTaskPositionCommand>
{
    private readonly ApplicationDbContext _context;
    private readonly IHubContext<ProjectHub> projectHub;
    private readonly IHubContext<ActivityHub> activityHub;
    private readonly IPublisher publisher;
    private readonly IHttpContextAccessor httpContextAccessor;
    private const string MinRank = "0|000000:";
    private const string MaxRank = "z|zzzzz:";

    public UpdateTaskPositionCommandHandler(ApplicationDbContext context,
        IHubContext<ProjectHub> projectHub,
        IHubContext<ActivityHub> activityHub,
        IPublisher publisher,
        IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        this.projectHub = projectHub;
        this.activityHub = activityHub;
        this.publisher = publisher;
        this.httpContextAccessor = httpContextAccessor;
    }

    public async Task Handle(UpdateTaskPositionCommand request, CancellationToken cancellationToken)
    {
        var task = await _context.Tasks.Include(t=>t.Members).FirstOrDefaultAsync(t => t.Id == request.TaskId, cancellationToken);
        if (task == null) throw new KeyNotFoundException("Task not found.");

        EntityTask? prevTask = null;
        EntityTask? nextTask = null;

        if (request.PreviousTaskId.HasValue)
            prevTask = await _context.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.Id == request.PreviousTaskId, cancellationToken);

        if (request.NextTaskId.HasValue)
            nextTask = await _context.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.Id == request.NextTaskId, cancellationToken);

        string prevRank = prevTask?.Rank ?? MinRank;
        string nextRank = nextTask?.Rank ?? MaxRank;

        if (prevRank == nextRank)
        {
            nextRank = nextRank + "z";
        }

        task.Rank = CalculateLexorank(prevRank, nextRank);
        task.Status = request.NewStatus;

        await _context.SaveChangesAsync(cancellationToken);


        await publisher.Publish(new TaskMovedEvent(
             task,
             httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier),
             task.ProjectId
            ));

        await projectHub.Clients.Group($"project_{task.ProjectId.ToString()}").SendAsync("TaskPositionUpdated", new
        {
            TaskId = task.Id,
            NewRank = task.Rank,
            NewStatus = task.Status
        }, cancellationToken);

        await activityHub.Clients.Group($"activity_{task.ProjectId.ToString()}").SendAsync("TaskUpdated", cancellationToken);
    }

    private string CalculateLexorank(string prev, string next)
    {
        var p = prev ?? MinRank;
        var n = next ?? MaxRank;
        var result = new System.Text.StringBuilder();
        int i = 0;

        while (true)
        {
            char charP = i < p.Length ? p[i] : '0';
            char charN = i < n.Length ? n[i] : 'z';

            if (charP == charN)
            {
                result.Append(charP);
                i++;
                continue;
            }

            int mid = (charP + charN) / 2;

            if (mid > charP)
            {
                result.Append((char)mid);
                break;
            }
            else
            {

                result.Append(charP);
                i++;
                if (i >= p.Length)
                {
                    result.Append('M'); 
                    break;
                }
            }
        }
        return result.ToString();
    }
}

// 3. Controller
[ApiController]
[Route("api/projects/{projectId}/tasks/{taskId}")]
[Authorize(Policy = "TaskMember")]
public class TasksController : ControllerBase
{
    private readonly IMediator mediator;
    public TasksController(IMediator mediator) => this.mediator = mediator;

    [HttpPatch("reorder")]
    public async Task<IActionResult> Reorder(int projectId, int taskId, [FromBody] UpdateTaskPositionCommand request)
    {
        if (taskId != request.TaskId)
            return BadRequest(new { Message = "Task ID in URL does not match Task ID in body." });
        try
        {
            await mediator.Send(request);
            return Ok();
        }
        catch (ValidationException e)
        {
            return BadRequest(new { Message = e.Message });
        }
        catch (KeyNotFoundException e)
        {
            {
                return NotFound(new { Message = e.Message });
            }
        }
    }

}