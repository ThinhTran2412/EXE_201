using Microsoft.Extensions.DependencyInjection;
using ShootMatch.Domain.Abstractions;
using ShootMatch.Domain.Common;

namespace ShootMatch.Infrastructure.Persistence;

/// <summary>
/// Dispatches domain events collected inside AggregateRoots after SaveChanges.
/// Resolves IDomainEventHandler&lt;T&gt; from DI and invokes all registered handlers.
///
/// Usage: call DispatchAsync() immediately after dbContext.SaveChangesAsync().
/// </summary>
public sealed class DomainEventDispatcher(IServiceProvider serviceProvider)
{
    /// <summary>
    /// Collects events from all AggregateRoot instances tracked by the DbContext,
    /// clears their event lists, then dispatches each event to its registered handlers.
    /// </summary>
    public async Task DispatchAsync(
        IEnumerable<AggregateRoot> aggregates,
        CancellationToken cancellationToken = default)
    {
        // Snapshot events before clearing — order matters
        var events = aggregates
            .SelectMany(a =>
            {
                var domainEvents = a.DomainEvents.ToList();
                a.ClearDomainEvents();
                return domainEvents;
            })
            .ToList();

        foreach (var domainEvent in events)
        {
            await DispatchSingleAsync(domainEvent, cancellationToken);
        }
    }

    private async Task DispatchSingleAsync(IDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        var eventType = domainEvent.GetType();
        var handlerType = typeof(IDomainEventHandler<>).MakeGenericType(eventType);
        var handlers = serviceProvider.GetServices(handlerType);

        foreach (var handler in handlers)
        {
            if (handler is null) continue;

            // Dynamically invoke HandleAsync via reflection (safe — interface is known)
            var method = handlerType.GetMethod(nameof(IDomainEventHandler<IDomainEvent>.HandleAsync))!;
            var task = (Task)method.Invoke(handler, [domainEvent, cancellationToken])!;
            await task;
        }
    }
}
