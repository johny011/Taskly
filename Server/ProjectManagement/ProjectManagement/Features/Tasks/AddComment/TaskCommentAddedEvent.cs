using MediatR;

namespace ProjectManagement.Features.Tasks.AddComment;

public record TaskCommentAddedEvent(
    int ProjectId,
    int TaskId,
    string TaskTitle,
    string ActorId,
    string CommentText,
    List<string> TaskMemberIds
) : INotification;