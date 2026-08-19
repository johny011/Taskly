using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using ProjectManagement.Data;
using ProjectManagement.Hubs;
using ProjectManagement.Models;
using System.Security.Claims;

namespace ProjectManagement.Features.Projects.UpdateDetails;

public record UpdateProjectDetailsCommand(int ProjectId,string Title,string Description):IRequest;

public class UpdateProjectDetialsMapper:Profile
{
    public UpdateProjectDetialsMapper()
    {
        CreateMap<UpdateProjectDetailsCommand, Project>();
    }
}

public class UpdateProjectDetialsCommandHandler : IRequestHandler<UpdateProjectDetailsCommand>
{
    private readonly ApplicationDbContext context;
    private readonly IMapper mapper;
    private readonly IHubContext<ProjectHub> projectHub;
    private readonly IPublisher publisher;
    private readonly IHttpContextAccessor httpContextAccessor;
    private readonly IHubContext<ActivityHub> activityHub;

    public UpdateProjectDetialsCommandHandler(ApplicationDbContext context,
        IMapper mapper,
        IHubContext<ProjectHub> projectHub,
        IPublisher publisher,
        IHttpContextAccessor httpContextAccessor,
        IHubContext<ActivityHub> activityHub)
    {
        this.context = context;
        this.mapper = mapper;
        this.projectHub = projectHub;
        this.publisher = publisher;
        this.httpContextAccessor = httpContextAccessor;
        this.activityHub = activityHub;
    }
    public async Task Handle(UpdateProjectDetailsCommand request, CancellationToken cancellationToken)
    {
        var project = await context.Projects.FindAsync(request.ProjectId);
        string projectTitle = project.Title;
        if (project == null)
            throw new KeyNotFoundException();

        mapper.Map(request, project);

        await context.SaveChangesAsync();
        var userId = httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        await publisher.Publish(new ProjectDetailsUpdatedEvent(project.Id,projectTitle, userId));
        await projectHub.Clients.Group($"project_{request.ProjectId}").SendAsync("ProjectDetailsUpdated");
        await activityHub.Clients.Group($"activity_{request.ProjectId}").SendAsync("ProjectDetailsUpdated");

    }
}

[Route("api/Projects/{projectId}")]
[Authorize(Policy = "ProjectManagerOrOwner")]
[ApiController]
public class UpdateProjectDetialsController:ControllerBase
{
    private readonly IMediator mediator;

    public UpdateProjectDetialsController(IMediator mediator)
    {
        this.mediator = mediator;
    }

    [HttpPut]
    public async Task<ActionResult> UpdateProject(int projectId,[FromBody] UpdateProjectDetailsCommand request)
    {
        try
        {
            await mediator.Send(request);
            return Ok();
        }
        catch(Exception ex)
        {
            return BadRequest(new { Message = ex.Message});
        }
    }
}