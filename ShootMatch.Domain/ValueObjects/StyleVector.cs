namespace ShootMatch.Domain.ValueObjects;

/// <summary>
/// Value Object — a style vector computed from portfolio images.
/// Wraps the raw float[] to carry domain semantics and encapsulate math operations.
/// Lives on SearchSession (user style) and can be used for scoring in MatchingOrchestrator.
/// </summary>
public sealed class StyleVector
{
    private readonly float[] _values;

    public int Dimensions => _values.Length;
    public IReadOnlyList<float> Values => _values;

    public StyleVector(float[] values)
    {
        if (values is null || values.Length == 0)
            throw new ArgumentException("Style vector cannot be empty.", nameof(values));

        _values = values;
    }

    /// <summary>
    /// Computes cosine similarity against another StyleVector.
    /// Returns a value in [-1, 1]. Higher = more similar style.
    /// </summary>
    public float CosineSimilarity(StyleVector other)
    {
        if (other.Dimensions != Dimensions)
            throw new InvalidOperationException($"Vector dimensions must match: {Dimensions} vs {other.Dimensions}.");

        float dot = 0f, normA = 0f, normB = 0f;
        for (int i = 0; i < Dimensions; i++)
        {
            dot   += _values[i] * other._values[i];
            normA += _values[i] * _values[i];
            normB += other._values[i] * other._values[i];
        }

        if (normA == 0f || normB == 0f) return 0f;
        return dot / (MathF.Sqrt(normA) * MathF.Sqrt(normB));
    }

    /// <summary>
    /// Computes the element-wise mean of a collection of StyleVectors (mean pooling).
    /// Used to aggregate multiple portfolio image embeddings into one representative vector.
    /// </summary>
    public static StyleVector MeanPool(IReadOnlyList<StyleVector> vectors)
    {
        if (vectors is null || vectors.Count == 0)
            throw new ArgumentException("At least one vector is required for mean pooling.", nameof(vectors));

        int dims = vectors[0].Dimensions;
        if (vectors.Any(v => v.Dimensions != dims))
            throw new InvalidOperationException("All vectors must have the same dimensions.");

        var result = new float[dims];
        foreach (var v in vectors)
            for (int i = 0; i < dims; i++)
                result[i] += v._values[i];

        for (int i = 0; i < dims; i++)
            result[i] /= vectors.Count;

        return new StyleVector(result);
    }

    // Serialisation helpers for persistence (stored as JSON)
    public string ToJson() => System.Text.Json.JsonSerializer.Serialize(_values);

    public static StyleVector FromJson(string json)
    {
        var values = System.Text.Json.JsonSerializer.Deserialize<float[]>(json)
            ?? throw new InvalidOperationException("Cannot deserialise style vector from JSON.");
        return new StyleVector(values);
    }
}
