namespace ShootMatch.Domain.Abstractions;

/// <summary>
/// Marker interface for all domain events.
/// Implement this on any record/class that represents something that happened in the domain.
/// </summary>
public interface IDomainEvent
{
    DateTime OccurredAt { get; }
}
