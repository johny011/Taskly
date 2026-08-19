using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.AccessRequirement.Services;
using ProjectManagement.Data;
using ProjectManagement.Hubs;
using ProjectManagement.Models;
using System.Security.Claims;

namespace ProjectManagement.Features.Projects.PromoteMember;

public record PromoteProjectMemberCommand(int ProjectId, string TargetUserId, ProjectRole NewRole) : IRequest;

public class PromoteProjectMemberValidator : AbstractValidator<PromoteProjectMemberCommand>
{
    public PromoteProjectMemberValidator()
    {
        RuleFor(x => x.TargetUserId).NotEmpty().WithMessage("TargetUserId is required");
        RuleFor(x => x.NewRole).IsInEnum().WithMessage("NewRole must be a valid ProjectRole");
    }
}

public class PromoteProjectMemberHandler : IRequestHandler<PromoteProjectMemberCommand>
{
    private readonly ApplicationDbContext context;
    private readonly IProjectAccessService accessService;
    private readonly IHubContext<ProjectHub> projectHubContext;
    private readonly IPublisher publisher;
    private readonly IHttpContextAccessor httpContextAccessor;
    private readonly IHubContext<ActivityHub> activityHubContext;

    public PromoteProjectMemberHandler(ApplicationDbContext context,
        IProjectAccessService accessService,
        IHubContext<ProjectHub> projectHubContext,
        IPublisher publisher,
        IHttpContextAccessor httpContextAccessor,
        IHubContext<ActivityHub> activityHubContext)
    {
        this.context = context;
        this.accessService = accessService;
        this.projectHubContext = projectHubContext;
        this.publisher = publisher;
        this.httpContextAccessor = httpContextAccessor;
        this.activityHubContext = activityHubContext;
    }

    public async Task Handle(PromoteProjectMemberCommand request, CancellationToken cancellationToken)
    {
        var projectId = request.ProjectId;
        var targetUserId = request.TargetUserId;

        var member = await context.ProjectMembers
            .Include(pm=>pm.User)
            .Include(pm=>pm.Project)
            .FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == targetUserId, cancellationToken);

        if (member == null)
            throw new Exception("User is not a member of the project");

        // If promoting to Owner, require the caller to be an Owner
        if (request.NewRole == ProjectRole.Owner)
        {
            return;
        }

        member.Role = request.NewRole;
        context.ProjectMembers.Update(member);
        await context.SaveChangesAsync(cancellationToken);
        string userId = httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        await publisher.Publish(new MemberPromotedEvent(projectId, userId,request.TargetUserId, request.NewRole,member.Project.Title,member.User.FullName), cancellationToken);
        await projectHubContext.Clients.Group($"project_{projectId}").SendAsync("ProjectMembersUpdated");
        await activityHubContext.Clients.Group($"activity_{projectId}").SendAsync("ProjectMembersUpdated");
    }
}

[Route("api/projects/{projectId}/members/{userId}/promote")]
[ApiController]
[Authorize(Policy = "ProjectOwner")]
public class PromoteProjectMemberController : ControllerBase
{
    private readonly IMediator mediator;

    public PromoteProjectMemberController(IMediator mediator)
    {
        this.mediator = mediator;
    }

    [HttpPut]
    public async Task<IActionResult> Promote(int projectId, string userId, [FromBody] PromoteRequest body)
    {
        try
        {

            var command = new PromoteProjectMemberCommand(projectId, userId, body.NewRole);
            await mediator.Send(command);
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    public class PromoteRequest
    {
        public ProjectRole NewRole { get; set; }
    }
}
