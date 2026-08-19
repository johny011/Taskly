using MediatR;

namespace ProjectManagement.Features.Tasks.Create;

public record TaskCreatedEvent(int ProjectId, int TaskId, string TaskTitle, string ActorId) : INotification;