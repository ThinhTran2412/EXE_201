namespace ShootMatch.Application.Abstractions;

/// <summary>Abstraction for cloud file storage (Supabase, S3, etc.).</summary>
public interface IStorageService
{
    /// <summary>Uploads a file and returns its public URL.</summary>
    Task<string> UploadAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default);

    /// <summary>Deletes a file by its public URL.</summary>
    Task DeleteAsync(string publicUrl, CancellationToken cancellationToken = default);
}
