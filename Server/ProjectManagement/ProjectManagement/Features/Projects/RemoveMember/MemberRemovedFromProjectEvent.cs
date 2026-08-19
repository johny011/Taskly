using MediatR;

namespace ProjectManagement.Features.Projects.RemoveMember;

public record MemberRemovedFromProjectEvent(
    int ProjectId,
    string UserId,
    string ActorId,
    string ProjectTitle,
    string UserName
    ) : INotification;