using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;
using ShootMatch.Domain.Events;

namespace ShootMatch.Application.Commands;

/// <summary>
/// Records a swipe action.
/// If direction = Right, raises SwipeRightRecorded so the mutual-match handler
/// can check whether a Match should be created.
/// </summary>
public sealed class RecordSwipeCommandHandler(
    ISwipeActionRepository swipeRepository,
    SwipeRightRecordedHandler mutualMatchHandler)
{
    public async Task HandleAsync(RecordSwipeCommand command, CancellationToken cancellationToken = default)
    {
        if (command.Direction is not ("Left" or "Right"))
            throw new ArgumentException("Direction must be 'Left' or 'Right'.", nameof(command));

        var swipe = new SwipeAction
        {
            Id               = Guid.NewGuid(),
            CustomerId       = command.CustomerId,
            SearchSessionId  = command.SearchSessionId,
            PhotographerId   = command.PhotographerId,
            Direction        = command.Direction,
            CreatedAt        = DateTime.UtcNow
        };

        await swipeRepository.SaveAsync(swipe, cancellationToken);

        // Only Right swipes are signals for mutual-match detection
        if (command.Direction == "Right")
        {
            var domainEvent = new SwipeRightRecorded(
                swipe.Id,
                swipe.CustomerId,
                swipe.PhotographerId,
                swipe.SearchSessionId,
                DateTime.UtcNow);

            await mutualMatchHandler.HandleAsync(domainEvent, cancellationToken);
        }
    }
}
