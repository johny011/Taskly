using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Models;
using System.Security.Claims;

namespace ProjectManagement.Features.Notification.ReadNotification;

public record ReadNotificationCommand(Guid UserNotificationId) : IRequest;
public class ReadNotificationCommandHandler : IRequestHandler<ReadNotificationCommand>
{
    private readonly ApplicationDbContext context;
    private readonly IHttpContextAccessor httpContextAccessor;

    public ReadNotificationCommandHandler(ApplicationDbContext context,IHttpContextAccessor httpContextAccessor)
    {
        this.context = context;
        this.httpContextAccessor = httpContextAccessor;
    }
    public async Task Handle(ReadNotificationCommand request, CancellationToken cancellationToken)
    {
        string UserId = httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(UserId))
            throw new UnauthorizedAccessException("User claim missing.");

        int rowsUpdated = await context.UserNotifications
            .Where(un => un.UserId == UserId && un.Id == request.UserNotificationId)
            .ExecuteUpdateAsync(ut => ut.SetProperty(x => x.IsRead, true), cancellationToken);

        if (rowsUpdated == 0)
        {
            throw new KeyNotFoundException("Notification not found or access denied.");
        }

    }
}

[Route("api/Notifications/SetRead")]
[ApiController]
[Authorize]
public class ReadNotificationController:ControllerBase
{
    private readonly IMediator mediator;

    public ReadNotificationController(IMediator mediator)
    {
        this.mediator = mediator;
    }

    [HttpPost]
    public async Task<ActionResult> ReadNotification([FromBody] ReadNotificationCommand request)
    {
        try
        {
            await mediator.Send(request);
            return Ok();
        }
        catch (KeyNotFoundException)
        {
            return NotFound("Notification not found.");
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

}