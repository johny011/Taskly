using MediatR;
using ProjectManagement.Models;

namespace ProjectManagement.Features.Projects.PromoteMember;

public record MemberPromotedEvent(
    int ProjectId,
    string ActorId,
    string UserId,
    ProjectRole Role,
    string ProjectTitle,
    string UserName) : INotification;
