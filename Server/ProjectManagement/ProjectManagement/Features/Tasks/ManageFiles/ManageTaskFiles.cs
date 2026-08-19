using System.Security.Claims;
using System.Text.Json.Serialization;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Features.Tasks.ManageFiles;
using ProjectManagement.Hubs;
using ProjectManagement.Models;

namespace ProjectManagement.Features.Tasks;

public record AddTaskFileCommand(int ProjectId, int TaskId, IFormFile File, [property: JsonIgnore] string UserId) : IRequest;

public class AddTaskFileCommandHandler : IRequestHandler<AddTaskFileCommand>
{
    private readonly ApplicationDbContext _context;
    private readonly ITaskFileStorageService _taskFileStorageService;
    private readonly IHubContext<TaskHub> taskHubContext;
    private readonly IHubContext<ActivityHub> activityHubContext;
    private readonly IHttpContextAccessor httpContextAccessor;
    private readonly IPublisher publisher;

    public AddTaskFileCommandHandler(ApplicationDbContext context,
        ITaskFileStorageService taskFileStorageService,
        IHubContext<TaskHub> taskHubContext,
        IHubContext<ActivityHub> activityHubContext,
        IHttpContextAccessor httpContextAccessor,
        IPublisher publisher)
    {
        _context = context;
        _taskFileStorageService = taskFileStorageService;
        this.taskHubContext = taskHubContext;
        this.activityHubContext = activityHubContext;
        this.httpContextAccessor = httpContextAccessor;
        this.publisher = publisher;
    }

    public async Task Handle(AddTaskFileCommand request, CancellationToken cancellationToken)
    {
        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == request.TaskId && t.ProjectId == request.ProjectId, cancellationToken);

        if (task == null)
            throw new KeyNotFoundException("Task not found.");

        var storedFilePath = await _taskFileStorageService
            .SaveTaskFileAsync(request.ProjectId, request.TaskId, request.File, cancellationToken);

        var taskFile = new TaskFiles
        {
            TaskId = request.TaskId,
            FilePath = storedFilePath,
            UserId = request.UserId,
            FileName = request.File.FileName
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

        _context.TaskFiles.Add(taskFile);
        await _context.SaveChangesAsync(cancellationToken);

        var actorId = httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        await publisher.Publish(new TaskFileAddedEvent(request.ProjectId, request.TaskId, task.Text, actorId,request.File.FileName, taskMembersIds));
        await taskHubContext.Clients.Group($"task_{request.TaskId}").SendAsync("TaskUpdated");
        await activityHubContext.Clients.Group($"activity_{request.ProjectId}").SendAsync("TaskUpdated");
    }
}

public record DeleteTaskFileCommand(int ProjectId, int TaskId, int FileId, string UserId) : IRequest;

public class DeleteTaskFileCommandHandler : IRequestHandler<DeleteTaskFileCommand>
{
    private readonly ApplicationDbContext _context;
    private readonly ITaskFileStorageService _taskFileStorageService;
    private readonly IHubContext<TaskHub> taskHubContext;
    private readonly IHubContext<ActivityHub> activityHubContext;
    private readonly IHttpContextAccessor httpContextAccessor;
    private readonly IPublisher publisher;

    public DeleteTaskFileCommandHandler(ApplicationDbContext context,
        ITaskFileStorageService taskFileStorageService,
        IHubContext<TaskHub> taskHubContext,
        IHubContext<ActivityHub> activityHubContext,
        IHttpContextAccessor httpContextAccessor,
        IPublisher publisher)
    {
        _context = context;
        _taskFileStorageService = taskFileStorageService;
        this.taskHubContext = taskHubContext;
        this.activityHubContext = activityHubContext;
        this.httpContextAccessor = httpContextAccessor;
        this.publisher = publisher;
    }

    public async Task Handle(DeleteTaskFileCommand request, CancellationToken cancellationToken)
    {
        var file = await _context.TaskFiles
            .FirstOrDefaultAsync(f => f.Id == request.FileId && f.TaskId == request.TaskId, cancellationToken);

        if (file == null)
            return;
           
        if (file.UserId != request.UserId)
        {
            var role = await _context.ProjectMembers
                .Where(pm => pm.ProjectId == request.ProjectId && pm.UserId == request.UserId)
                .Select(pm => pm.Role)
                .FirstOrDefaultAsync(cancellationToken);

            if (role != ProjectRole.Owner && role != ProjectRole.Manager)
                throw new UnauthorizedAccessException("You do not have permission to delete this file.");

        }

        string fileName = file.FileName;

        var taskTitle = (await _context.Tasks.SingleOrDefaultAsync(t => t.Id == request.TaskId && t.ProjectId == request.ProjectId)).Text;

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


        await _taskFileStorageService.DeleteTaskFileAsync(file.FilePath, cancellationToken);

        _context.TaskFiles.Remove(file);
        await _context.SaveChangesAsync(cancellationToken);

        var actorId = httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        await publisher.Publish(new TaskFileDeletedEvent(request.ProjectId, request.TaskId, taskTitle, actorId,fileName, taskMembersIds));
        await taskHubContext.Clients.Group($"task_{request.TaskId}").SendAsync("TaskUpdated");
        await activityHubContext.Clients.Group($"activity_{request.ProjectId}").SendAsync("TaskUpdated");
    }
}

public record TaskFileRequest(IFormFile? File);

[ApiController]
[Route("api/projects/{projectId}/tasks/{taskId}/files")]
[Authorize(Policy = "TaskMember")]
public class ManageTaskFilesController : ControllerBase
{
    private readonly IMediator _mediator;

    public ManageTaskFilesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> AddFile(int projectId, int taskId, [FromForm] TaskFileRequest request)
    {
        if (request.File is null || request.File.Length == 0)
            return BadRequest(new { Message = "File is required." });

        var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

        await _mediator.Send(new AddTaskFileCommand(projectId, taskId, request.File, userId));
        return Ok();
    }

    [HttpDelete("{fileId:int}")]
    public async Task<IActionResult> DeleteFile(int projectId, int taskId, int fileId)
    {
        var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        try
        {

            await _mediator.Send(new DeleteTaskFileCommand(projectId, taskId, fileId, userId));
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }
}
