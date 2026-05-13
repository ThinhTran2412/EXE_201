using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Abstractions;
using ShootMatch.Domain.Aggregates;
using ShootMatch.Domain.Events;

namespace ShootMatch.Application.Commands;

/// <summary>
/// Handles SwipeRightRecorded:
/// 1. Checks if photographer has already swiped Right on this customer (mutual match).
/// 2. If yes — creates MatchAggregate, calls Accept() → raises MatchCreated, saves.
/// 3. Dispatches MatchCreated events manually (in-memory repos don't use DbContext dispatcher).
/// 4. Deduplicates: if a Match already exists for this pair, skips silently.
/// </summary>
public sealed class SwipeRightRecordedHandler(
    ISwipeActionRepository swipeRepository,
    IMatchRepository matchRepository,
    MatchCreatedHandler matchCreatedHandler)
    : IDomainEventHandler<SwipeRightRecorded>
{
    public async Task HandleAsync(
        SwipeRightRecorded domainEvent,
        CancellationToken cancellationToken = default)
    {
        // Deduplication — don't create a second match for the same pair
        var existing = await matchRepository.FindAsync(
            domainEvent.CustomerId,
            domainEvent.PhotographerId,
            cancellationToken);

        if (existing is not null) return;

        // Check if photographer has expressed interest in this customer.
        // NOTE: InMemorySwipeActionRepository.HasPhotographerSwipedRightAsync returns true (MVP stub).
        // TODO: when replacing with PostgreSQL, query:
        //   SELECT 1 FROM swipe_actions
        //   WHERE photographer_id = @photographerId AND customer_id = @customerId AND direction = 'Right'
        var isMutual = await swipeRepository.HasPhotographerSwipedRightAsync(
            domainEvent.PhotographerId,
            domainEvent.CustomerId,
            cancellationToken);

        if (!isMutual) return;

        // Mutual interest confirmed — create and activate the match
        var match = MatchAggregate.Create(
            domainEvent.CustomerId,
            domainEvent.PhotographerId,
            domainEvent.SearchSessionId);

        match.Accept(); // Pending → Active, raises MatchCreated event internally

        await matchRepository.SaveAsync(match, cancellationToken);

        // Manually dispatch MatchCreated events because in-memory repos bypass DbContext.
        // When migrating to PostgreSQL + EF Core, DbContext.SaveChangesAsync() will dispatch automatically.
        foreach (var domainEvt in match.DomainEvents.OfType<MatchCreated>())
        {
            await matchCreatedHandler.HandleAsync(domainEvt, cancellationToken);
        }
    }
}
