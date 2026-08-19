using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Hubs;
using ProjectManagement.Models;
using System.Security.Claims;

namespace ProjectManagement.Features.Projects.AddMembers;

public record AddProjectMembersCommand(int ProjectId, List<string> userIds) : IRequest;

public class AddProjectMembersValidator : AbstractValidator<AddProjectMembersCommand>
{
    public AddProjectMembersValidator()
    {
        RuleFor(x => x.userIds)
            .NotEmpty().WithMessage("UserIds cannot be empty")
            .Must(x => x.All(id => !string.IsNullOrEmpty(id))).WithMessage("All userIds must be valid strings");
    }
}

public class AddProjectMembersCommandHandler : IRequestHandler<AddProjectMembersCommand>
{
    private readonly ApplicationDbContext context;
    private readonly IPublisher publisher;
    private readonly IHttpContextAccessor httpContextAccessor;
    private readonly IHubContext<ProjectHub> projectHub;
    private readonly IHubContext<ActivityHub> activityHub;

    public AddProjectMembersCommandHandler(ApplicationDbContext context,
        IPublisher publisher,
        IHttpContextAccessor httpContextAccessor,
        IHubContext<ProjectHub> projectHub,
        IHubContext<ActivityHub> activityHub)
    {
        this.context = context;
        this.publisher = publisher;
        this.httpContextAccessor = httpContextAccessor;
        this.projectHub = projectHub;
        this.activityHub = activityHub;
    }
    public async Task Handle(AddProjectMembersCommand request, CancellationToken cancellationToken)
    {
        var projectId = request.ProjectId; // Get the projectId from the request or context
        var existingMembers = await context.ProjectMembers
            .Where(pm => pm.ProjectId == projectId && request.userIds.Contains(pm.UserId))
            .Select(pm => pm.UserId)
            .ToListAsync(cancellationToken);

        var newMembers = request.userIds
            .Except(existingMembers)
            .Select(userId => new ProjectMember
            {
                ProjectId = projectId,
                UserId = userId,
                Role = ProjectRole.Member
            }).ToList();

        if (newMembers.Any())
        {
            await context.ProjectMembers.AddRangeAsync(newMembers, cancellationToken);
            await context.SaveChangesAsync(cancellationToken);


            var newMemberUserIds = newMembers.Select(m => m.UserId).ToList();

            var usersDictionary = await context.Users
                .Where(u => newMemberUserIds.Contains(u.Id))
                .Select(u => new { u.Id, Name = u.FullName})
                .ToDictionaryAsync(u => u.Id, u => u.Name, cancellationToken);

            var actorId = httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier)!;


            foreach (var member in newMembers)
            {
                var memberName = usersDictionary.GetValueOrDefault(member.UserId, "User");

                await publisher.Publish(new MemberAddedToProjectEvent(
                    request.ProjectId,
                    member.UserId,
                    memberName,
                    actorId
                ), cancellationToken);
            }

            await projectHub.Clients.Group($"project_{projectId}").SendAsync("ProjectMembersUpdated");
            await activityHub.Clients.Group($"activity_{projectId}").SendAsync("ProjectMembersUpdated");
        }

       
    }
}

[Route("api/projects/{projectId}/members/bulk")]
[ApiController]
[Authorize(Policy = "ProjectManagerOrOwner")]
public class AddProjectMembersController : ControllerBase
{
    private readonly IMediator mediator;

    public AddProjectMembersController(IMediator mediator)
    {
        this.mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> AddMembers(int projectId, [FromBody] List<string> userIds)
    {
        try
        {
            var command = new AddProjectMembersCommand(projectId, userIds);
            await mediator.Send(command);
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
