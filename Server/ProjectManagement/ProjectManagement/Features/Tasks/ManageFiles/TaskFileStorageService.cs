using Microsoft.AspNetCore.Http;

namespace ProjectManagement.Features.Tasks;

public interface ITaskFileStorageService
{
    Task<string> SaveTaskFileAsync(int projectId, int taskId, IFormFile file, CancellationToken cancellationToken);
    Task DeleteTaskFileAsync(string? filePath, CancellationToken cancellationToken);
    string NormalizeStoredPath(string? filePath);
}

public class TaskFileStorageService : ITaskFileStorageService
{
    private readonly string _webRootPath;

    public TaskFileStorageService(IWebHostEnvironment environment)
    {
        _webRootPath = environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot");
    }

    public async Task<string> SaveTaskFileAsync(int projectId, int taskId, IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
            throw new ArgumentException("File is required.");

        var uploadsRoot = Path.Combine(_webRootPath, "uploads", $"project-{projectId}", $"task-{taskId}");
        Directory.CreateDirectory(uploadsRoot);

        var extension = Path.GetExtension(file.FileName);
        var fileName = $"{DateTime.UtcNow:yyyyMMddHHmmssfff}_{Guid.NewGuid():N}{extension}";
        var fullPath = Path.Combine(uploadsRoot, fileName);

        await using var stream = new FileStream(fullPath, FileMode.Create);
        await file.CopyToAsync(stream, cancellationToken);

        return $"/uploads/tasks/project-{projectId}/task-{taskId}/{fileName}";
    }

    public async Task DeleteTaskFileAsync(string? filePath, CancellationToken cancellationToken)
    {
        var normalizedPath = NormalizeStoredPath(filePath);
        if (string.IsNullOrWhiteSpace(normalizedPath))
            return;

        var relativePath = normalizedPath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        var fullPath = Path.Combine(_webRootPath, relativePath);

        if (!File.Exists(fullPath))
            return;

        await Task.Run(() => File.Delete(fullPath), cancellationToken);
    }

    public string NormalizeStoredPath(string? filePath)
    {
        if (string.IsNullOrWhiteSpace(filePath))
            return string.Empty;

        var normalized = filePath.Trim().Replace('\\', '/');
        return normalized.StartsWith('/') ? normalized : $"/{normalized}";
    }
}
