using Microsoft.Extensions.Configuration;
using ShootMatch.Application.Abstractions;

namespace ShootMatch.Infrastructure.Storage;

/// <summary>
/// Stores uploads on a local disk path under wwwroot/uploads.
/// Folder is created automatically on first startup on any machine.
/// </summary>
public sealed class LocalDiskStorageService : IStorageService
{
    private readonly string _uploadRoot;
    private readonly string _publicBaseUrl;

    public LocalDiskStorageService(IConfiguration configuration)
    {
        _uploadRoot = configuration["Storage:LocalPath"] ?? @"D:\pic_Stogare";
        if (!Directory.Exists(_uploadRoot))
        {
            try
            {
                Directory.CreateDirectory(_uploadRoot);
            }
            catch
            {
                // Fallback nếu máy không có ổ D (chẳng hạn Mac/Linux)
                _uploadRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                Directory.CreateDirectory(_uploadRoot);
            }
        }
        
        _publicBaseUrl = (configuration["Storage:PublicBaseUrl"] ?? "http://localhost:5062").TrimEnd('/');
    }

    public async Task<string> UploadAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        var safeName = fileName.Replace('\\', '/').TrimStart('/');
        var targetPath = Path.Combine(_uploadRoot, safeName.Replace('/', Path.DirectorySeparatorChar));
        var targetDir = Path.GetDirectoryName(targetPath);
        if (!string.IsNullOrWhiteSpace(targetDir))
            Directory.CreateDirectory(targetDir);

        await using var output = File.Create(targetPath);
        await fileStream.CopyToAsync(output, cancellationToken);

        return $"{_publicBaseUrl}/uploads/{safeName}";
    }

    public Task DeleteAsync(string publicUrl, CancellationToken cancellationToken = default)
    {
        if (!TryResolvePath(publicUrl, out var path))
            return Task.CompletedTask;

        if (File.Exists(path))
            File.Delete(path);

        return Task.CompletedTask;
    }

    private bool TryResolvePath(string publicUrl, out string fullPath)
    {
        fullPath = string.Empty;
        if (string.IsNullOrWhiteSpace(publicUrl))
            return false;

        string candidatePath;
        if (Uri.TryCreate(publicUrl, UriKind.Absolute, out var uri))
            candidatePath = uri.AbsolutePath;
        else
            candidatePath = publicUrl;

        var marker = "/uploads/";
        var idx = candidatePath.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
        if (idx < 0)
            return false;

        var relative = candidatePath[(idx + marker.Length)..]
            .Trim('/')
            .Replace('/', Path.DirectorySeparatorChar);
        fullPath = Path.Combine(_uploadRoot, relative);
        return true;
    }
}
