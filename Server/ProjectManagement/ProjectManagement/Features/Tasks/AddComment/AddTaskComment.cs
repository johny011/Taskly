using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Features.Tasks.AddComment;
using ProjectManagement.Hubs;
using ProjectManagement.Models;
using System.Security.Claims;

namespace ProjectManagement.Features.Tasks;

public record AddTaskCommentCommand(int ProjectId, int TaskId, string UserId, string Text) : IRequest;

public class AddTaskCommentCommandHandler : IRequestHandler<AddTaskCommentCommand>
{
    private readonly ApplicationDbContext _context;
    private readonly IHubContext<TaskHub> taskHubContext;
    private readonly IHttpContextAccessor httpContextAccessor;
    private readonly IHubContext<ActivityHub> activityHubContext;
    private readonly IPublisher publisher;

    public AddTaskCommentCommandHandler(ApplicationDbContext context,
        IHubContext<TaskHub> taskHubContext,
        IHttpContextAccessor httpContextAccessor,
        IHubContext<ActivityHub> activityHubContext,
        IPublisher publisher)
    {
        _context = context;
        this.taskHubContext = taskHubContext;
        this.httpContextAccessor = httpContextAccessor;
        this.activityHubContext = activityHubContext;
        this.publisher = publisher;
    }

    public async Task Handle(AddTaskCommentCommand request, CancellationToken cancellationToken)
    {
        var task = await _context.Tasks
            .Where(t => t.Id == request.TaskId && t.ProjectId == request.ProjectId)
            .SingleOrDefaultAsync(cancellationToken);

        if (task == null)
            throw new KeyNotFoundException("Task not found.");

        var comment = new Comment
        {
            TaskId = request.TaskId,
            UserId = request.UserId,
            Text = request.Text.Trim(),
            CreatedAt = DateTime.UtcNow
        };

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

        _context.Comments.Add(comment);
        await _context.SaveChangesAsync(cancellationToken);
        

        string userId = httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        await publisher.Publish(new TaskCommentAddedEvent(request.ProjectId,
            request.TaskId,
            task.Text,
            userId,
            request.Text,
            taskMembersIds
            ));
        await taskHubContext.Clients.Group($"task_{request.TaskId}").SendAsync("TaskUpdated");
        await activityHubContext.Clients.Group($"activity_{request.ProjectId}").SendAsync("TaskUpdated");
    }
}

public record AddTaskCommentRequest(string Text);

[ApiController]
[Route("api/projects/{projectId}/tasks/{taskId}/comments")]
[Authorize(Policy = "TaskMember")]
public class AddTaskCommentController : ControllerBase
{
    private readonly IMediator _mediator;

    public AddTaskCommentController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> AddComment(int projectId, int taskId, [FromBody] AddTaskCommentRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        await _mediator.Send(new AddTaskCommentCommand(projectId, taskId, userId, request.Text));
        return NoContent();
    }
}
