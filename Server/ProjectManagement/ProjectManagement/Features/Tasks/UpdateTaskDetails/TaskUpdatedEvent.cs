using MediatR;

namespace ProjectManagement.Features.Tasks.UpdateTaskDetails;

public record TaskUpdatedEvent(
    int ProjectId,
    int TaskId,
    string TaskTitle,
    string ActorId,
    List<string> TaskMemberIds
) : INotification;
