using MediatR;

namespace ProjectManagement.Features.Tasks.DeleteTaskById;

public record TaskDeletedEvent(int ProjectId, int TaskId, string TaskTitle, string ActorId, List<string> TaskMemberIds) : INotification;
