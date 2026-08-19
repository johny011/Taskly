using MediatR;

namespace ProjectManagement.Features.Tasks.ManageMembers;

public record MemberRemovedFromTaskEvent(string UserId,
    string ActorId,
    int ProjectId,
    int TaskId,
    string TaskTitle,
    string MemberName
    ) : INotification;
