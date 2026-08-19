using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Models;

namespace ProjectManagement.Features.Tasks;



public record GetTaskDetailsQuery(int ProjectId, int TaskId) : IRequest<TaskDetailsDto>;

public class GetTaskDetailsQueryHandler : IRequestHandler<GetTaskDetailsQuery, TaskDetailsDto>
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ITaskFileStorageService _taskFileStorageService;

    public GetTaskDetailsQueryHandler(ApplicationDbContext context, IMapper mapper, ITaskFileStorageService taskFileStorageService)
    {
        _context = context;
        _mapper = mapper;
        _taskFileStorageService = taskFileStorageService;
    }

    public async Task<TaskDetailsDto> Handle(GetTaskDetailsQuery request, CancellationToken cancellationToken)
    {
        var task = await _context.Tasks
            .Where(t => t.Id == request.TaskId && t.ProjectId == request.ProjectId)
            .ProjectTo<TaskDetailsDto>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync();

        if (task == null)
            throw new KeyNotFoundException("Task not found.");

        var result = _mapper.Map<TaskDetailsDto>(task);
        var normalizedFiles = result.Files
            .Select(file => file with { FilePath = _taskFileStorageService.NormalizeStoredPath(file.FilePath) })
            .ToList();

        return result with { Files = normalizedFiles };
    }
}


public record MemberDto(string Id, string FullName, string Email, string ImageUrl);

public record TaskFileDto(int Id, string FilePath, string FileName, MemberDto User);

public record CommentDto(int Id, string Text, MemberDto User,DateTime CreatedAt);

public record TaskDetailsDto(
    string Text,
    string? Description,
    EntityTaskStatus Status,
    DateTime? CreatedAt,
    List<MemberDto> Members,
    List<TaskFileDto> Files,
    List<CommentDto> Comments);

public class TaskDetailsProfile : Profile
{
    public TaskDetailsProfile()
    {
        CreateMap<User, MemberDto>();

        CreateMap<TaskFiles, TaskFileDto>();

        CreateMap<Comment, CommentDto>();

        CreateMap<EntityTask, TaskDetailsDto>()
            .ForMember(dest => dest.Comments,
                opt => opt.MapFrom(src => src.Comments
                    .OrderByDescending(c => c.CreatedAt)));
    }
}


[ApiController]
[Route("api/projects/{projectId}/tasks/{taskId}")]
[Authorize(Policy = "TaskMember")]
public class GetTaskByIdController : ControllerBase
{
    private readonly IMediator mediator;
    public GetTaskByIdController(IMediator mediator) => this.mediator = mediator;


    [HttpGet]
    public async Task<ActionResult<TaskDetailsDto>> GetTaskDetails(int projectId, int taskId)
    {
        try
        {
            var result = await mediator.Send(new GetTaskDetailsQuery(projectId, taskId));
            return Ok(result);
        }
        catch (KeyNotFoundException e)
        {
            return NotFound(new { Message = e.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
}