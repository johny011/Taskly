using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Hubs;
using ProjectManagement.Models;
using System.Security.Claims;

namespace ProjectManagement.Features.Tasks.UpdateComment;

public record UpdateCommentCommand(int ProjectId, int TaskId, int CommentId, string UserId, string Text) : IRequest;

public class UpdateCommentCommandHandler : IRequestHandler<UpdateCommentCommand>
{
    private readonly ApplicationDbContext context;
    private readonly IHubContext<TaskHub> hubContext;
    private readonly IHttpContextAccessor httpContextAccessor;
    private readonly IPublisher publisher;

    public UpdateCommentCommandHandler(ApplicationDbContext context,
        IHubContext<TaskHub> hubContext,
        IHttpContextAccessor httpContextAccessor,
        IPublisher publisher
        )
    {
        this.context = context;
        this.hubContext = hubContext;
        this.httpContextAccessor = httpContextAccessor;
        this.publisher = publisher;
    }
    public async Task Handle(UpdateCommentCommand request, CancellationToken cancellationToken)
    {
        var comment = await context.Comments
            .FirstOrDefaultAsync(c => c.Id == request.CommentId
                                   && c.TaskId == request.TaskId
                                   && c.Task.ProjectId == request.ProjectId, cancellationToken);

        if (comment == null)
        {
            throw new KeyNotFoundException("Comment not found.");
        }

        var isAuthor = comment.UserId == request.UserId;
        var isManager = await context.ProjectMembers
            .AnyAsync(pm => pm.ProjectId == request.ProjectId
                         && pm.UserId == request.UserId
                         && pm.Role != ProjectRole.Member, cancellationToken);

        if (!isAuthor && !isManager)
        {
            throw new UnauthorizedAccessException("You are not authorized to edit this comment.");
        }

        string taskTitle = (await context.Tasks.FindAsync(request.TaskId)).Text;
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
            .ToListAsync();
        comment.Text = request.Text;
        context.Comments.Update(comment);
        await context.SaveChangesAsync();

        await hubContext.Clients.Group($"task_{request.TaskId}").SendAsync(
            "CommentUpdated");

        string actorId = httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);

        await publisher.Publish(new TaskCommentUpdatedEvent(request.ProjectId,
            request.TaskId,
            taskTitle, actorId,
            taskMembersIds));
    }
}

[Route("api/Projects/{projectId}/Tasks/{taskId}/Comments/{commentId}")]
[ApiController]
[Authorize]
public class UpdateCommentController:ControllerBase
{
    private readonly IMediator mediator;

    public UpdateCommentController(IMediator mediator)
    {
        this.mediator = mediator;
    }

    [HttpPut]
    public async Task<ActionResult> UpdateComment(int projectId,int taskId,int commentId,[FromBody] UpdateCommentRequestDto request)
    {
        var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var command = new UpdateCommentCommand(projectId, taskId, commentId, userId, request.Text);
        try
        {
            await mediator.Send(command);
            return Ok();
        }
        catch(KeyNotFoundException ex)
        {
            return StatusCode(StatusCodes.Status404NotFound);
        }
        catch(UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }
    }
}

public record UpdateCommentRequestDto(string Text);