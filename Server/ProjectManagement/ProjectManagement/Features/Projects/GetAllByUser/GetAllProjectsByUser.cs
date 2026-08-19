using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Models;
using System.Security.Claims;
using System.Text.Json.Serialization;

namespace ProjectManagement.Features.Projects.GetAllByUser;

public record GetAllProjectsByUserQuery(string Search):IRequest<List<GetAllProjectsByUserDto>>
{
    [JsonIgnore]
    public string? UserId { get; set; }
}

public class GetAllProjectsByUserDto
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
}

public class GetAllProjectsByUserMapper : Profile
{
    public GetAllProjectsByUserMapper()
    {
        CreateMap<Project,GetAllProjectsByUserDto>();
    }
}

public class GetAllProjectsByUserQueryHandler : IRequestHandler<GetAllProjectsByUserQuery, List<GetAllProjectsByUserDto>>
{
    private readonly ApplicationDbContext context;
    private readonly IMapper mapper;

    public GetAllProjectsByUserQueryHandler(ApplicationDbContext context,IMapper mapper)
    {
        this.context = context;
        this.mapper = mapper;
    }
    public async Task<List<GetAllProjectsByUserDto>> Handle(GetAllProjectsByUserQuery request, CancellationToken cancellationToken)
    {
        var query = context.Projects
             .AsNoTracking()
             .Where(p => p.ProjectMembers.Any(pm => pm.UserId == request.UserId));

        if(!string.IsNullOrWhiteSpace(request.Search))
        {
            query = query.Where(p => p.Title.Contains(request.Search) || p.Description.Contains(request.Search));
        }

        var projects=  await query.ProjectTo<GetAllProjectsByUserDto>(mapper.ConfigurationProvider)
             .ToListAsync();
        return projects;
    }
}

[Route("api/Projects")]
[ApiController]
[Authorize]
public class ProjectsController:ControllerBase
{
    private readonly IMediator mediator;

    public ProjectsController(IMediator mediator)
    {
        this.mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<List<GetAllProjectsByUserDto>>> GetProjects([FromQuery] string? search = null)
    {
        var query = new GetAllProjectsByUserQuery(search);
        query.UserId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier).Value;
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
