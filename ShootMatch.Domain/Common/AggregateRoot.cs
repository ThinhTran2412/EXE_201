using ShootMatch.Domain.Abstractions;

namespace ShootMatch.Domain.Common;

/// <summary>
/// Base class for all Aggregate Roots.
/// Collects domain events raised during a business operation.
/// Events are dispatched after SaveChanges by DomainEventDispatcher.
/// </summary>
public abstract class AggregateRoot
{
    private readonly List<IDomainEvent> _domainEvents = [];

    public IReadOnlyList<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    /// <summary>
    /// Call this inside aggregate methods when a meaningful business event occurs.
    /// </summary>
    protected void RaiseDomainEvent(IDomainEvent domainEvent) =>
        _domainEvents.Add(domainEvent);

    /// <summary>
    /// Called by the dispatcher after events have been published. Clears the list.
    /// </summary>
    public void ClearDomainEvents() => _domainEvents.Clear();
}
