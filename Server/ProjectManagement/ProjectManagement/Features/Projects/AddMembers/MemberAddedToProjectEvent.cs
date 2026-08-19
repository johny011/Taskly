using MediatR;

namespace ProjectManagement.Features.Projects.AddMembers;

public record MemberAddedToProjectEvent(
    int ProjectId,
    string UserId,
    string MemberName,
    string ActorId
) : INotification;