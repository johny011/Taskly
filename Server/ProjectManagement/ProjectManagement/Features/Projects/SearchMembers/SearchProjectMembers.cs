using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Models;

namespace ProjectManagement.Features.Projects.SearchMembers;

public record SearchProjectMembersQuery(int ProjectId, string Query) : IRequest<List<ProjectMemberSearchDto>>;

public class ProjectMemberSearchDto
{
    public string? Id { get; set; }
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? ImageUrl { get; set; }
    public ProjectRole Role { get; set; }
}

public class SearchProjectMembersMapper : Profile
{
    public SearchProjectMembersMapper()
    {
        CreateMap<ProjectMember, ProjectMemberSearchDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.UserId))
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.User.FullName))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.User.Email))
            .ForMember(dest => dest.ImageUrl, opt => opt.MapFrom(src => src.User.ImageUrl))
            .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role));
    }
}

public class SearchProjectMembersQueryHandler : IRequestHandler<SearchProjectMembersQuery, List<ProjectMemberSearchDto>>
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public SearchProjectMembersQueryHandler(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<ProjectMemberSearchDto>> Handle(SearchProjectMembersQuery request, CancellationToken cancellationToken)
    {
        var normalizedQuery = (request.Query ?? string.Empty).Trim();

        var query = _context.ProjectMembers
            .Where(pm => pm.ProjectId == request.ProjectId);

        if (!string.IsNullOrWhiteSpace(normalizedQuery))
        {
            query = query.Where(pm =>
                (pm.User.FullName != null && pm.User.FullName.Contains(normalizedQuery)) ||
                (pm.User.Email != null && pm.User.Email.Contains(normalizedQuery)));
        }

        var members = await query
            .OrderBy(pm => pm.User.FullName)
            .ProjectTo<ProjectMemberSearchDto>(_mapper.ConfigurationProvider)
            .Take(20)
            .ToListAsync(cancellationToken);

        return members;
    }
}

[Route("api/projects/{projectId}/members/search")]
[ApiController]
[Authorize(Policy = "ProjectAny")]
public class SearchProjectMembersController : ControllerBase
{
    private readonly IMediator _mediator;

    public SearchProjectMembersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<List<ProjectMemberSearchDto>>> Search(int projectId, [FromQuery] string query = "", CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new SearchProjectMembersQuery(projectId, query), cancellationToken);
        return Ok(result);
    }
}