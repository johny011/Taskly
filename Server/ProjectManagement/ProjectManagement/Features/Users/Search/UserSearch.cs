using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Models;

namespace ProjectManagement.Features.Users.Search;

public record UserSearchQuery(string Query):IRequest<List<UserSearchDto>>;

public class UserSearchDto
{
    public string Id { get; set; }
    public string FullName { get; set; }
    public string Email { get; set; }
    public string ImageUrl { get; set; }
}

public class UserSearchMapper:Profile
{
    public UserSearchMapper()
    {
        CreateMap<User,UserSearchDto>();
    }
}

public class UserSearchQueryHandler : IRequestHandler<UserSearchQuery, List<UserSearchDto>>
{
    private readonly IMapper mapper;
    private readonly ApplicationDbContext context;

    public UserSearchQueryHandler(IMapper mapper,ApplicationDbContext context)
    {
        this.mapper = mapper;
        this.context = context;
    }
    public async Task<List<UserSearchDto>> Handle(UserSearchQuery request, CancellationToken cancellationToken)
    {
        var result = await context.Users
            .Where(u=>u.FullName.Contains(request.Query) || u.Email.Contains(request.Query))
            .ProjectTo< UserSearchDto>(mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

        return result;
    }
}

[Route("api/Users/Search")]
[ApiController]
public class UserSearchController : ControllerBase
{
    private readonly IMediator mediator;

    public UserSearchController(IMediator mediator)
    {
        this.mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<List<UserSearchDto>>> Search([FromQuery] string query)
    {
        var result = await mediator.Send(new UserSearchQuery(query));
        return Ok(result);
    }
}