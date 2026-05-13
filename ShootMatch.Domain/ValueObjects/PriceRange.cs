namespace ShootMatch.Domain.ValueObjects;

/// <summary>
/// Value Object — photographer's pricing range.
/// Enforces MinBudget ≤ MaxBudget invariant at construction.
/// </summary>
public sealed record PriceRange
{
    public decimal Min { get; }
    public decimal Max { get; }

    public PriceRange(decimal min, decimal max)
    {
        if (min < 0)
            throw new ArgumentException("Minimum budget cannot be negative.", nameof(min));
        if (max < min)
            throw new ArgumentException("Maximum budget cannot be less than minimum budget.", nameof(max));

        Min = min;
        Max = max;
    }

    /// <summary>Returns true if a customer budget falls within this range.</summary>
    public bool Includes(decimal budget) => budget >= Min && budget <= Max;

    public override string ToString() => $"{Min:N0}–{Max:N0} VND";
}
