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

namespace ProjectManagement.Features.Notification.GetByAuthenticatedUser;


public record GetNotificationsQuery(string UserId) : IRequest<List<GetNotificationsDto>>;
public class GetNotificationsDto
{
    public Guid UserNotificationId { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public string MessageTemplate { get; set; }
    public string NotificationType { get; set; }
    public DateTime CreatedAt { get; set; }
    public ActivityDto? Activity { get; set; }
}

public class ActivityDto
{
    public Guid ActivityId { set; get; }
    public int ProjectId { set; get; }
    public string ProjectTitle { get; set; }
    public string ActionType { set; get; }
    public string EntityType { set; get; }
    public string EntityId { set; get; }
    public Dictionary<string, string>? Properties { get; set; }
    public ActorDto? Actor { set; get; }

}

public class ActorDto
{
    public string Id { set; get; } 
    public string FullName { set; get; }
    public string? Email { set; get; }
}

public class GetNotificationsMapper : Profile
{
    public GetNotificationsMapper()
    {
        CreateMap<User, ActorDto>();

        CreateMap<Activity, ActivityDto>()
            .ForMember(dest => dest.ActivityId, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.ActionType, opt => opt.MapFrom(src => src.ActionType.ToString()))
            .ForMember(dest => dest.Actor, opt => opt.MapFrom(src => src.Actor))
            .ForMember(dest => dest.ProjectTitle, opt => opt.MapFrom(src => src.Project.Title))
            .ForMember(dest => dest.Properties, opt => opt.MapFrom(src => SafeDeserialize(src.Properties)));

        CreateMap<UserNotification, GetNotificationsDto>()
            .ForMember(dest => dest.UserNotificationId, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.MessageTemplate, opt => opt.MapFrom(src => src.Notification.MessageTemplate))
            .ForMember(dest => dest.NotificationType, opt => opt.MapFrom(src => src.Notification.NotificationType.ToString()))
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.Notification.CreatedAt))
            .ForMember(dest => dest.Activity, opt => opt.MapFrom(src => src.Notification.Activity));
    }

    private static Dictionary<string, string>? SafeDeserialize(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;

        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, string>>(
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

public class GetNotificationsQueryHandler:IRequestHandler<GetNotificationsQuery,List<GetNotificationsDto>>
{
    private readonly ApplicationDbContext context;
    private readonly IMapper mapper;

    public GetNotificationsQueryHandler(ApplicationDbContext context,IMapper mapper)
    {
        this.context = context;
        this.mapper = mapper;
    }

    public async Task<List<GetNotificationsDto>> Handle(GetNotificationsQuery request, CancellationToken cancellationToken)
    {
        var userNotifications = await context.UserNotifications
            .AsNoTracking()
            .Where(un => un.UserId == request.UserId)
            .Include(un => un.Notification)
                .ThenInclude(n => n.Activity)
                    .ThenInclude(a => a.Project)
            .Include(un => un.Notification)
                .ThenInclude(n => n.Activity)
                    .ThenInclude(a => a.Actor)
            .OrderByDescending(un => un.Notification.CreatedAt)
            .ToListAsync(cancellationToken);

        return mapper.Map<List<GetNotificationsDto>>(userNotifications);
    }
}

[Route("api/Notifications")]
[ApiController]
[Authorize]
public class GetNotificationsController:ControllerBase
{
    private readonly IMediator mediator;

    public GetNotificationsController(IMediator mediator)
    {
        this.mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<List<GetNotificationsDto>>> GettNotifications()
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var notifications = await mediator.Send(new GetNotificationsQuery(userId));
            return Ok(notifications);
        }
        catch
        {
            return BadRequest();
        }
    }
}