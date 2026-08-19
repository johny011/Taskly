using MediatR;

namespace ProjectManagement.Features.Tasks.UpdateComment;

public record TaskCommentUpdatedEvent(
    int ProjectId,
    int TaskId,
    string TaskTitle,
    string ActorId,
    List<string> TaskMemberIds
) : INotification;
