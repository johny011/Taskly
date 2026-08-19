using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Models;
using System.Security.Claims;
using System.Text.Json;

namespace ProjectManagement.Features.Projects.GetProjectActivities;

// 1. DTO الخاص بعرض النشاط
public class ProjectActivityDto
{
    public Guid Id { set; get; }
    public int ProjectId { set; get; }
    public string ActorId { set; get; }
    public string ActorName { set; get; }
    public string? ActorAvatar { set; get; }
    public string EntityId { set; get; }
    public string EntityType { set; get; }
    public ActionType ActionType { set; get; }
    public Dictionary<string, object>? Properties { set; get; }
    public DateTime CreatedAt { set; get; }
}


public class ProjectActivityMapper : Profile
{
    public ProjectActivityMapper()
    {
        CreateMap<Activity, ProjectActivityDto>()
            .ForMember(a => a.ActorName, src => src.MapFrom(a => a.Actor.FullName))
            .ForMember(a => a.ActorAvatar, src => src.MapFrom(a => a.Actor.ImageUrl))
            .ForMember(a => a.Properties, src => src.MapFrom(a => SafeDeserialize(a.Properties)));
    }

    private static Dictionary<string, object>? SafeDeserialize(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;

        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, object>>(
                json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            );
        }
        catch
        {
            return null;
        }
    }
}
public record GetProjectActivitiesQuery(int ProjectId, string UserId) : IRequest<List<ProjectActivityDto>>;

// 3. Query Handler
public class GetProjectActivitiesQueryHandler : IRequestHandler<GetProjectActivitiesQuery, List<ProjectActivityDto>>
{
    private readonly ApplicationDbContext context;
    private readonly IMapper mapper;

    public GetProjectActivitiesQueryHandler(ApplicationDbContext context, IMapper mapper)
    {
        this.context = context;
        this.mapper = mapper;
    }

    public async Task<List<ProjectActivityDto>> Handle(GetProjectActivitiesQuery request, CancellationToken cancellationToken)
    {
        // جلب النشاطات مرتبة من الأحدث إلى الأقدم مع تضمين بيانات الـ Actor
        var activities = await context.Activities
            .AsNoTracking()
            .Where(a => a.ProjectId == request.ProjectId)
            .OrderByDescending(a => a.CreatedAt)
            .ProjectTo<ProjectActivityDto>(mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

        return activities;
    }
}

// 4. API Controller
[Route("api/Projects/{projectId}/Activities")]
[ApiController]
[Authorize(Policy = "ProjectManagerOrOwner")]
public class GetProjectActivitiesController : ControllerBase
{
    private readonly IMediator mediator;

    public GetProjectActivitiesController(IMediator mediator)
    {
        this.mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<List<ProjectActivityDto>>> GetProjectActivities(int projectId)
    {
        var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);


        var query = new GetProjectActivitiesQuery(projectId, userId);

        try
        {
            var result = await mediator.Send(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new {Message = ex.Message});
        }
    }
}
