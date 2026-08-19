using Microsoft.AspNetCore.Authorization;
using ProjectManagement.AccessRequirement.Services;
using ProjectManagement.AccessRequirement;
using System.Security.Claims;

public class ProjectAccessHandler : AuthorizationHandler<ProjectAccessRequirement>
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IProjectAccessService _projectAccessService;

    public ProjectAccessHandler(
        IHttpContextAccessor httpContextAccessor,
        IProjectAccessService projectAccessService)
    {
        _httpContextAccessor = httpContextAccessor;
        _projectAccessService = projectAccessService;
    }

    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, ProjectAccessRequirement requirement)
    {
        // Extract userId from Claims
        string userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            context.Fail();
            return;
        }

        // Extract projectId from route (e.g., route template: "api/projects/{projectId}/...")
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

        bool isAuthorized = false;

        // Check authorization based on requirements
        if (requirement.RequireOwner && await _projectAccessService.IsOwner(userId, projectId))
            isAuthorized = true;
        else if (requirement.RequireManager && await _projectAccessService.IsManager(userId, projectId))
            isAuthorized = true;
        else if (requirement.RequireMember && await _projectAccessService.IsMember(userId, projectId))
            isAuthorized = true;

        if (isAuthorized)
            context.Succeed(requirement);
        else
            context.Fail();
    }
}