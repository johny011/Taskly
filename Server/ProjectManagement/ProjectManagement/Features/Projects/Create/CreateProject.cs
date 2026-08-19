using AutoMapper;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Data;
using ProjectManagement.Models;
using System.Security.Claims;
using System.Text.Json.Serialization;

namespace ProjectManagement.Features.Projects.Create;

//Command
public record CreateProjectCommand(string Title, string Description) : IRequest
{
    [JsonIgnore]
    public string? UserId { get; set; }
}

//CommandHandler
public class CreateProjectCommandHandler : IRequestHandler<CreateProjectCommand>
{
    private readonly ApplicationDbContext context;
    private readonly IMapper mapper;

    public CreateProjectCommandHandler(ApplicationDbContext context, IMapper mapper)
    {
        this.context = context;
        this.mapper = mapper;
    }
    public async Task Handle(CreateProjectCommand request, CancellationToken cancellationToken)
    {
        var project = mapper.Map<Project>(request);
        project.ProjectMembers.Add(new ProjectMember
        {
            UserId = request.UserId!,
            Role = ProjectRole.Owner
        });
        await context.Projects.AddAsync(project);
        await context.SaveChangesAsync();
    }
}

//Validator
public class CreateProjectValidator : AbstractValidator<CreateProjectCommand>
{
    public CreateProjectValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .MinimumLength(5).WithMessage("mininum length for title is 5");

        RuleFor(x => x.Description)
            .NotEmpty()
            .MinimumLength(20).WithMessage("Minimum length for desciption is 20");
    }
}
//Mapper
public class CreateProjectMapper : Profile
{
    public CreateProjectMapper()
    {
        CreateMap<CreateProjectCommand, Project>();
    }
}

//Controller
[Route("api/Projects")]
[ApiController]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly IMediator mediator;

    public ProjectsController(IMediator mediator)
    {
        this.mediator = mediator;
    }

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] CreateProjectCommand request)
    {
        try
        {
            var userId = User.Claims.FirstOrDefault(x=>x.Type==ClaimTypes.NameIdentifier)?.Value;
            request .UserId = userId;
            await mediator.Send(request);
            return Created();
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
}
