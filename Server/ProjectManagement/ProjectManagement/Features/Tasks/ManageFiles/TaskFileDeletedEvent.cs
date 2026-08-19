using MediatR;

namespace ProjectManagement.Features.Tasks.ManageFiles;

public record TaskFileDeletedEvent(
    int ProjectId,
    int TaskId,
    string TaskTitle,
    string ActorId,
    string FileName,
    List<string> TaskMemberIds
) : INotification;