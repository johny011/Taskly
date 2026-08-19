using Microsoft.AspNetCore.Authorization;
using ProjectManagement.AccessRequirement.Services;
using System.Security.Claims;

namespace ProjectManagement.AccessRequirement;

public class TaskAccessHandler : AuthorizationHandler<TaskAccessRequirement>
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IProjectAccessService _projectAccessService;
    private readonly ITaskMemberService _taskMemberService;

    public TaskAccessHandler(
        IHttpContextAccessor httpContextAccessor,
        IProjectAccessService projectAccessService,
        ITaskMemberService taskMemberService)
    {
        _httpContextAccessor = httpContextAccessor;
        _projectAccessService = projectAccessService;
        _taskMemberService = taskMemberService;
    }

    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, TaskAccessRequirement requirement)
    {
        string userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            context.Fail();
            return;
        }

        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null)
        {
            context.Fail();
            return;
        }

        var routeData = httpContext.GetRouteData();

        var projectIdValue = routeData.Values["projectId"]?.ToString();
        if (!int.TryParse(projectIdValue, out var projectId))
        {
            context.Fail();
            return;
        }

        var taskIdValue = routeData.Values["taskId"]?.ToString();
        if (!int.TryParse(taskIdValue, out var taskId))
        {
            context.Fail();
            return;
        }

        bool isAuthorized = false;

        // Check project-level authorization first
        if (requirement.RequireOwner && await _projectAccessService.IsOwner(userId, projectId))
            isAuthorized = true;
        else if (requirement.RequireManager && await _projectAccessService.IsManager(userId, projectId))
            isAuthorized = true;
        else if (requirement.RequireMember && await _taskMemberService.IsMember(userId, taskId))
            isAuthorized = true;

        if (isAuthorized)
            context.Succeed(requirement);
        else
            context.Fail();
    }
}
