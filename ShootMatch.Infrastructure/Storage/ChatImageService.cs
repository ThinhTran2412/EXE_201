using ShootMatch.Application.Abstractions;

namespace ShootMatch.Infrastructure.Storage;

public sealed class ChatImageService(IStorageService storage) : IChatImageService
{
    public async Task<ChatImageUploadResult> UploadAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        Guid conversationId,
        CancellationToken cancellationToken = default)
    {
        var ext = Path.GetExtension(fileName).TrimStart('.').ToLowerInvariant();
        if (string.IsNullOrEmpty(ext)) ext = "jpg";
        var baseId = Guid.NewGuid().ToString("N");
        var fullName = $"chat/{conversationId:N}/{baseId}_full.{ext}";
        var previewName = $"chat/{conversationId:N}/{baseId}_preview.{ext}";

        fileStream.Position = 0;
        var fullUrl = await storage.UploadAsync(fileStream, fullName, contentType, cancellationToken);

        fileStream.Position = 0;
        var previewUrl = await storage.UploadAsync(fileStream, previewName, contentType, cancellationToken);
        return new ChatImageUploadResult(fullUrl, previewUrl, DateTime.UtcNow.AddDays(3));
    }

    public Task DowngradeMessageAsync(
        Guid messageId,
        string originalUrl,
        string previewUrl,
        CancellationToken cancellationToken = default)
        => storage.DeleteAsync(originalUrl, cancellationToken);
}
