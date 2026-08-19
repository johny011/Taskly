using AutoMapper;
using AutoMapper.QueryableExtensions;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Models;

namespace ProjectManagement.Features.Projects.GetProjectById;


public record GetProjectByIdQuery(int ProjectId, string UserId) : IRequest<GetProjectByIdDto>;

public class GetProjectByIdDto
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    

    public ProjectRole Role { get; set; }   
}

public class GetProjectByIdMapper : Profile
{
    public GetProjectByIdMapper()
    {
        string userId = null;

        CreateMap<Project, GetProjectByIdDto>()
                .ForMember(dest=>dest.Role,opt => opt.MapFrom(
                    src=> src.ProjectMembers.Where(pm=>pm.UserId == userId)
                    .SingleOrDefault().Role));
        
    }
}

public class GetProjectByIdValidation : AbstractValidator<GetProjectByIdQuery>
{
    public GetProjectByIdValidation()
    {
        RuleFor(p => p.ProjectId)
            .NotNull().WithMessage("ProjectId is required!");
    }
}

public class GetProjectByIdIdQueryHandler : IRequestHandler<GetProjectByIdQuery, GetProjectByIdDto>
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetProjectByIdIdQueryHandler(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<GetProjectByIdDto> Handle(GetProjectByIdQuery request, CancellationToken cancellationToken)
    {
        var project = await _context.Projects
            .Where(p => p.Id == request.ProjectId)
            .AsNoTracking()
            .ProjectTo<GetProjectByIdDto>(_mapper.ConfigurationProvider, new { userId = request.UserId })
            .SingleOrDefaultAsync(cancellationToken);

        return project;
    }
}

[Route("api/Projects")]
[ApiController]
[Authorize(Policy = "ProjectAny")]
public class ProjectsController : ControllerBase
{
    private readonly IMediator mediator;

    public ProjectsController(IMediator mediator)
    {
        this.mediator = mediator;
    }

    [HttpGet("{projectId}")]
    public async Task<ActionResult<GetProjectByIdDto>> GetById(int projectId)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        var query = new GetProjectByIdQuery(projectId, userId);

        try
        {
            var project = await mediator.Send(query);
            if (project == null) return NotFound();

            return Ok(project);
        }
        catch (Exception ex)
        {
            return BadRequest(new { ex.Message });
        }
    }
}
