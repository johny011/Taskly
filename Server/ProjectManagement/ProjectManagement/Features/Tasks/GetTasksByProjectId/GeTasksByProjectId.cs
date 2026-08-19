using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Models;
using System.Security.Claims;

namespace ProjectManagement.Features.Tasks.GetTasksByProjectId;

public record GetTasksByProjectIdQuery(int ProjectId,string UserId) : IRequest<List<GetTasksByProjectIdDto>>;

public class GetTasksByProjectIdQueryHandler : IRequestHandler<GetTasksByProjectIdQuery, List<GetTasksByProjectIdDto>>
{
    private readonly ApplicationDbContext context;
    private readonly IMapper mapper;

    public GetTasksByProjectIdQueryHandler(ApplicationDbContext context, IMapper mapper)
    {
        this.context = context;
        this.mapper = mapper;
    }
    public async Task<List<GetTasksByProjectIdDto>> Handle(GetTasksByProjectIdQuery request, CancellationToken cancellationToken)
    {
        var userRole = (await context.ProjectMembers
            .SingleOrDefaultAsync(x => x.UserId == request.UserId && x.ProjectId == request.ProjectId))
            .Role;

        List<GetTasksByProjectIdDto> tasks;
        if (userRole == ProjectRole.Owner || userRole == ProjectRole.Manager )
            tasks = await context.Tasks
            .Where(t => t.ProjectId == request.ProjectId)
            .OrderBy(t => t.Rank)
            .ProjectTo<GetTasksByProjectIdDto>(mapper.ConfigurationProvider)
            .ToListAsync();
        else
        tasks = await context.Tasks
            .Where(t => t.ProjectId == request.ProjectId && t.Members.Any(m=>m.Id==request.UserId))
            .OrderBy(t => t.Rank) // تأكد من ترتيب المهام بناءً على الحقل Rank
            .ProjectTo<GetTasksByProjectIdDto>(mapper.ConfigurationProvider)
            .ToListAsync();
        return tasks;
    }
}

public class GetTasksByProjectIdMapper : Profile
{
    public GetTasksByProjectIdMapper()
    {
        CreateMap<EntityTask, GetTasksByProjectIdDto>();
    }
}

public record GetTasksByProjectIdDto(int Id, string Text, EntityTaskStatus Status,string Rank);

[Route("api/Projects/{projectId}/Tasks")]
[ApiController]
[Authorize(Policy = "ProjectAny")]
public class TasksController : ControllerBase
{
    private readonly IMediator mediator;

    public TasksController(IMediator mediator)
    {
        this.mediator = mediator;
    }

    [HttpGet()]
    public async Task<ActionResult<List<GetTasksByProjectIdDto>>> GetTasks(int projectId)
    {
        var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        var query = new GetTasksByProjectIdQuery(projectId,userId);

        try
        {
            var result = await mediator.Send(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
}


