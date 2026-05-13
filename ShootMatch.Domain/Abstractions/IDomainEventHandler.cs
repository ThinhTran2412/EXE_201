namespace ShootMatch.Domain.Abstractions;

/// <summary>
/// Handler contract for a specific domain event.
/// Register implementations in DI — dispatcher will resolve and invoke all handlers.
/// </summary>
public interface IDomainEventHandler<in TEvent> where TEvent : IDomainEvent
{
    Task HandleAsync(TEvent domainEvent, CancellationToken cancellationToken = default);
}
