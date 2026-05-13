namespace ShootMatch.Application.Abstractions;

public interface IEmbeddingEncoder
{
    Task<float[]> EncodeImageAsync(string imageUrl, CancellationToken cancellationToken);
}
