using MediatR;

namespace ProjectManagement.Features.Tasks.DeleteComment;

public record TaskCommentDeletedEvent(
    int ProjectId,
    int TaskId,
    string TaskTitle,
    string ActorId,
    string CommentText,
    List<string> TaskMemberIds
) : INotification;
