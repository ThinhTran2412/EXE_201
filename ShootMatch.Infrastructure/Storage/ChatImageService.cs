using ShootMatch.Application.Abstractions;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

namespace ShootMatch.Infrastructure.Storage;

public sealed class ChatImageService(IStorageService storage) : IChatImageService
{
    private const int PreviewMaxEdge = 720;
    private const int PreviewQuality = 75;
    private static readonly TimeSpan Retention = TimeSpan.FromDays(3);

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
        var previewName = $"chat/{conversationId:N}/{baseId}_preview.jpg";

        fileStream.Position = 0;
        var fullUrl = await storage.UploadAsync(fileStream, fullName, contentType, cancellationToken);

        fileStream.Position = 0;
        MemoryStream previewStream;
        try
        {
            previewStream = await CreatePreviewStreamAsync(fileStream, cancellationToken);
        }
        catch
        {
            fileStream.Position = 0;
            previewStream = new MemoryStream();
            await fileStream.CopyToAsync(previewStream, cancellationToken);
            previewStream.Position = 0;
        }

        await using (previewStream)
        {
            var previewUrl = await storage.UploadAsync(previewStream, previewName, "image/jpeg", cancellationToken);
            return new ChatImageUploadResult(fullUrl, previewUrl, DateTime.UtcNow.Add(Retention));
        }
    }

    public async Task DowngradeMessageAsync(
        Guid messageId,
        string originalUrl,
        string previewUrl,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await storage.DeleteAsync(originalUrl, cancellationToken);
        }
        catch
        {
            // Bản gốc có thể đã xóa — vẫn chuyển sang preview
        }
    }

    private static async Task<MemoryStream> CreatePreviewStreamAsync(Stream input, CancellationToken cancellationToken)
    {
        var output = new MemoryStream();
        using var image = await Image.LoadAsync(input, cancellationToken);
        image.Mutate(x =>
        {
            var max = Math.Max(image.Width, image.Height);
            if (max > PreviewMaxEdge)
            {
                var scale = PreviewMaxEdge / (double)max;
                var w = (int)Math.Round(image.Width * scale);
                var h = (int)Math.Round(image.Height * scale);
                x.Resize(w, h);
            }
        });
        await image.SaveAsJpegAsync(output, new SixLabors.ImageSharp.Formats.Jpeg.JpegEncoder { Quality = PreviewQuality }, cancellationToken);
        output.Position = 0;
        return output;
    }
}
