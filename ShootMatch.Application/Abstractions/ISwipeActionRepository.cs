using ShootMatch.Domain.Entities;

namespace ShootMatch.Application.Abstractions;

public interface ISwipeActionRepository
{
    Task SaveAsync(SwipeAction swipe, CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns true if the given photographer has swiped Right on the given customer
    /// within any search session — used for mutual match detection.
    /// </summary>
    Task<bool> HasPhotographerSwipedRightAsync(
        Guid photographerId,
        Guid customerId,
        CancellationToken cancellationToken = default);
}
