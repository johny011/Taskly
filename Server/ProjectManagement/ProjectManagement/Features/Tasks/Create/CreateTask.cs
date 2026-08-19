using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Hubs;
using ProjectManagement.Models;
using System.Security.Claims;

namespace ProjectManagement.Features.Tasks.Create;

public record CreateTaskCommand(string Text, int ProjectId, EntityTaskStatus Status = EntityTaskStatus.ToDo) : IRequest;

public class CreateTaskCommandHandler : IRequestHandler<CreateTaskCommand>
{
    private readonly ApplicationDbContext context;
    private readonly IMapper mapper;
    private readonly IHubContext<ProjectHub> projectHub;
    private readonly IHubContext<ActivityHub> activityHub;
    private readonly IHttpContextAccessor httpContextAccessor;
    private readonly IPublisher publisher;

    public CreateTaskCommandHandler(ApplicationDbContext context,
        IMapper mapper,
        IHubContext<ProjectHub> projectHub,
        IHubContext<ActivityHub> activityHub,
        IHttpContextAccessor httpContextAccessor,
        IPublisher publisher)
    {
        this.context = context;
        this.mapper = mapper;
        this.projectHub = projectHub;
        this.activityHub = activityHub;
        this.httpContextAccessor = httpContextAccessor;
        this.publisher = publisher;
    }

    public async Task Handle(CreateTaskCommand request, CancellationToken cancellationToken)
    {
        var task = mapper.Map<EntityTask>(request);

        // 1. جلب آخر مهمة (أعلى رتبة) في نفس المشروع ونفس الحالة
        var lastTask = await context.Tasks
            .Where(t => t.ProjectId == request.ProjectId && t.Status == request.Status)
            .OrderByDescending(t => t.Rank)
            .FirstOrDefaultAsync(cancellationToken);

        // 2. تعيين الرتبة الجديدة
        if (lastTask == null)
        {
            // إذا كان العمود فارغاً، نعطي رتبة متوسطة افتراضية
            task.Rank = "0|h00000:";
        }
        else
        {
            // توليد رتبة تأتي بعد آخر رتبة موجودة
            task.Rank = LexoRankHelper.GetRankAfter(lastTask.Rank);
        }

        context.Tasks.Add(task);
        await context.SaveChangesAsync();
        string userId = httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        await publisher.Publish(new TaskCreatedEvent(request.ProjectId, task.Id, request.Text, userId));
        await projectHub.Clients.Group($"project_{request.ProjectId}").SendAsync("TaskAdded");
        await activityHub.Clients.Group($"activity_{request.ProjectId}").SendAsync("TaskAdded");
    }
}
public class CreateTaskMapper : Profile
{
    public CreateTaskMapper()
    {
        CreateMap<CreateTaskCommand, EntityTask>();
    }
}

[Route("api/Projects/{projectId}/Tasks")]
[ApiController]
[Authorize(Policy = "ProjectManagerOrOwner")]
public class TasksController : ControllerBase
{
    private readonly IMediator mediator;

    public TasksController(IMediator mediator)
    {
        this.mediator = mediator;
    }

    [HttpPost]
    public async Task<ActionResult> Create(int projectId, [FromBody] CreateTaskCommand request)
    {
        if (projectId != request.ProjectId)
            return BadRequest(new { Message = "project id in route is not equal to json" });
        try
        {
            await mediator.Send(request);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
}