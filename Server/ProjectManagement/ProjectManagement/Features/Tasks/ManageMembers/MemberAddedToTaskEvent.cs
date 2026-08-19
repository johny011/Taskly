using MediatR;

namespace ProjectManagement.Features.Tasks.ManageMembers;

public record MemberAddedToTaskEvent(
    string UserId,
    int ProjectId,
    int TaskId,
    string ActorId,
    string TaskTitle,
    string MemberName

    ) : INotification;
