using System;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Models;

namespace ProjectManagement.Features.Projects.GetMembers;

public record GetProjectMembersQuery(int ProjectId) : IRequest<List<ProjectMembersDto>>;


public class ProjectMembersDto
{
    public string Id { get; set; }
    public string FullName { get; set; }
    public string Email { get; set; }
    public string ImageUrl { get; set; }
    public ProjectRole Role { get; set; }
}

public class GetProjectMembersMapper : Profile
{
    public GetProjectMembersMapper()
    {
        CreateMap<ProjectMember, ProjectMembersDto>()
        .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.UserId))
        .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.User.FullName))
        .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.User.Email))
        .ForMember(dest => dest.ImageUrl, opt => opt.MapFrom(src => src.User.ImageUrl))
        .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role));
    }
}

public class GetProjectMembersQueryHandler : IRequestHandler<GetProjectMembersQuery, List<ProjectMembersDto>>
{
    private readonly ApplicationDbContext context;
    private readonly IMapper mapper;

    public GetProjectMembersQueryHandler(ApplicationDbContext context, IMapper mapper)
    {
        this.context = context;
        this.mapper = mapper;
    }

    public async Task<List<ProjectMembersDto>> Handle(GetProjectMembersQuery request, CancellationToken cancellationToken)
    {
        var members = await context.ProjectMembers
            .Where(pm => pm.ProjectId == request.ProjectId)
            .ProjectTo<ProjectMembersDto>(mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

        return members;
    }
}

[Route("api/projects/{projectId}/members")]
[ApiController]
[Authorize(Policy ="ProjectAny")]
public class GetProjectMembersController : ControllerBase
{
    private readonly IMediator mediator;

    public GetProjectMembersController(IMediator mediator)
    {
        this.mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<List<ProjectMembersDto>>> GetMembers(int projectId, CancellationToken cancellationToken)
    {
        var members = await mediator.Send(new GetProjectMembersQuery(projectId), cancellationToken);
        return Ok(members);
    }
}
