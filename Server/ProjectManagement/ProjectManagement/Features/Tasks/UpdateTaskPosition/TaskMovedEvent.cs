using MediatR;
using ProjectManagement.Models;

namespace ProjectManagement.Features.Tasks.UpdateTaskPosition;

public record TaskMovedEvent(EntityTask Task, string ActorId, int ProjectId) : INotification;
