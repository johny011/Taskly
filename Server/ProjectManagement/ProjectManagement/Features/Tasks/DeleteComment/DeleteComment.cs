using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Hubs;
using ProjectManagement.Models;
using System.Security.Claims;

namespace ProjectManagement.Features.Tasks.DeleteComment;

public record DeleteCommentCommand(int ProjectId, int TaskId, int CommentId, string UserId) : IRequest;

public class DeleteCommentCommandHandler : IRequestHandler<DeleteCommentCommand>
{
    private readonly ApplicationDbContext context;
    private readonly IHubContext<TaskHub> taskHub;
    private readonly IHubContext<ActivityHub> activityHub;
    private readonly IHttpContextAccessor httpContextAccessor;
    private readonly IPublisher publisher;

    public DeleteCommentCommandHandler(
        ApplicationDbContext context,
        IHubContext<TaskHub> taskHub,
        IHubContext<ActivityHub> activityHub,
        IHttpContextAccessor httpContextAccessor,
        IPublisher publisher)
    {
        this.context = context;
        this.taskHub = taskHub;
        this.activityHub = activityHub;
        this.httpContextAccessor = httpContextAccessor;
        this.publisher = publisher;
    }

    public async Task Handle(DeleteCommentCommand request, CancellationToken cancellationToken)
    {
        var comment = await context.Comments
            .Include(c => c.Task)
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
            throw new UnauthorizedAccessException("You are not authorized to delete this comment.");
        }

        string taskTitle = comment.Task.Text;
        string commentText = comment.Text;
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

        context.Comments.Remove(comment);
        await context.SaveChangesAsync(cancellationToken);

        string actorId = httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);

        await publisher.Publish(new TaskCommentDeletedEvent(
            request.ProjectId,
            request.TaskId,
            taskTitle,
            actorId,
            commentText,
            taskMembersIds
        ), cancellationToken);

        await taskHub.Clients.Group($"task_{request.TaskId}")
            .SendAsync("CommentDeleted", request.CommentId, cancellationToken);

        await activityHub.Clients.Group($"activity_{request.ProjectId}")
            .SendAsync("TaskUpdated", request.CommentId, cancellationToken);
    }
}

[Route("api/Projects/{projectId}/Tasks/{taskId}/Comments/{commentId}")]
[ApiController]
[Authorize]
public class DeleteCommentController : ControllerBase
{
    private readonly IMediator mediator;

    public DeleteCommentController(IMediator mediator)
    {
        this.mediator = mediator;
    }

    [HttpDelete]
    public async Task<ActionResult> DeleteComment(int projectId, int taskId, int commentId)
    {
        var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var command = new DeleteCommentCommand(projectId, taskId, commentId, userId);

        try
        {
            await mediator.Send(command);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return StatusCode(StatusCodes.Status404NotFound);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }
    }
}