namespace ShootMatch.Application.Abstractions;

public sealed record ChatImageUploadResult(string PhotoUrl, string PreviewUrl, DateTime ExpiresAt);

public interface IChatImageService
{
    Task<ChatImageUploadResult> UploadAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        Guid conversationId,
        CancellationToken cancellationToken = default);

    Task DowngradeMessageAsync(
        Guid messageId,
        string originalUrl,
        string previewUrl,
        CancellationToken cancellationToken = default);
}
