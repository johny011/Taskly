using MediatR;
using ProjectManagement.Models;

namespace ProjectManagement.Features.Projects.UpdateDetails;

public record ProjectDetailsUpdatedEvent(
    int ProjectId,
    string ProjectTitle,
    string ActorId
    ) : INotification;
