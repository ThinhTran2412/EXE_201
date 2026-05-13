using ShootMatch.Domain.ValueObjects;

namespace ShootMatch.Domain.Services;

/// <summary>
/// Legacy static helper — kept for backward compatibility with MatchingOrchestrator.
/// All math has moved into <see cref="StyleVector"/> as first-class domain behaviour.
/// TODO: migrate MatchingOrchestrator to use StyleVector directly, then remove this class.
/// </summary>
[Obsolete("Use StyleVector.MeanPool() and StyleVector.CosineSimilarity() instead.")]
public static class VectorMath
{
    /// <inheritdoc cref="StyleVector.MeanPool"/>
    public static float[] MeanPool(IReadOnlyList<float[]> vectors)
    {
        if (vectors.Count == 0) return [];

        var wrapped = vectors
            .Select(v => new StyleVector(v))
            .ToList();

        return StyleVector.MeanPool(wrapped).Values.ToArray();
    }

    /// <inheritdoc cref="StyleVector.CosineSimilarity"/>
    public static double CosineSimilarity(IReadOnlyList<float> left, IReadOnlyList<float> right)
    {
        if (left.Count == 0 || right.Count == 0 || left.Count != right.Count) return 0d;

        var a = new StyleVector(left.ToArray());
        var b = new StyleVector(right.ToArray());
        return a.CosineSimilarity(b);
    }
}
