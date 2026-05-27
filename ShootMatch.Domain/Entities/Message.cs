namespace ShootMatch.Domain.Entities;

public sealed class Message
{
    public Guid Id { get; init; }
    public Guid ConversationId { get; init; }
    public Guid SenderId { get; init; }
    public string SenderRole { get; init; } = string.Empty;
    public string Content { get; init; } = string.Empty;
    public string ContentType { get; init; } = "Text";
    /// <summary>URL ảnh bản thấp — dùng sau khi hết hạn bản gốc.</summary>
    public string? MediaPreviewUrl { get; init; }
    /// <summary>UTC — sau thời điểm này client/API trả về bản preview.</summary>
    public DateTime? MediaExpiresAt { get; init; }
    public bool MediaDowngraded { get; init; }
    public DateTime SentAt { get; init; }
    public DateTime? ReadAt { get; init; }

    /// <summary>URL hiển thị cho client (text hoặc ảnh đã resolve tier).</summary>
    public string DisplayContent =>
        ContentType == "Image" && MediaExpiresAt.HasValue && DateTime.UtcNow >= MediaExpiresAt.Value
            && !string.IsNullOrWhiteSpace(MediaPreviewUrl)
            ? MediaPreviewUrl!
            : Content;
}
