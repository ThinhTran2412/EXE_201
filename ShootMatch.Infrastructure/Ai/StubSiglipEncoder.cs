using ShootMatch.Application.Abstractions;
using System.Security.Cryptography;
using System.Text;

namespace ShootMatch.Infrastructure.Ai;

public sealed class StubSiglipEncoder : IEmbeddingEncoder
{
    private const int Dimension = 768;

    public Task<float[]> EncodeImageAsync(string imageUrl, CancellationToken cancellationToken)
    {
        // Deterministic stub for MVP: replace with SigLIP inference service call.
        var seedBytes = SHA256.HashData(Encoding.UTF8.GetBytes(imageUrl));
        var values = new float[Dimension];

        for (var i = 0; i < Dimension; i++)
        {
            var b = seedBytes[i % seedBytes.Length];
            values[i] = (b / 255f) * 2f - 1f;
        }

        return Task.FromResult(values);
    }
}
