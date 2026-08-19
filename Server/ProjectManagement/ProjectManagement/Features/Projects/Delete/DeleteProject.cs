using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Data;

namespace ProjectManagement.Features.Projects.Delete;

public record DeleteProjectCommand(int ProjectId) : IRequest;

public class DeleteProjectCommmandHandler : IRequestHandler<DeleteProjectCommand>
{
    private readonly ApplicationDbContext context;

    public DeleteProjectCommmandHandler(ApplicationDbContext context)
    {
        this.context = context;
    }

    public async Task Handle(DeleteProjectCommand request, CancellationToken cancellationToken)
    {
        var project = await context.Projects.FindAsync(request.ProjectId);
        if (project == null)
            throw new KeyNotFoundException();

        context.Projects.Remove(project);
        await context.SaveChangesAsync(cancellationToken);
    }
}

[Route("api/Projects/{projectId}")]
[ApiController]
[Authorize(Policy = "ProjectManagerOrOwner")]
public class DeleteProjectController:ControllerBase
{
    private readonly IMediator mediator;

    public DeleteProjectController(IMediator mediator)
    {
        this.mediator = mediator;
    }

    [HttpDelete]
    public async Task<ActionResult> Delete(int projectId)
    {
        try
        {
            await mediator.Send(new DeleteProjectCommand(projectId));
            return NoContent();
        }
        catch(Exception exp)
        {
            return BadRequest();
        }
    }
}


