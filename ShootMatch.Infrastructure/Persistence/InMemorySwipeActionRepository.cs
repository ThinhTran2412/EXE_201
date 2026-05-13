using System.Collections.Concurrent;
using Microsoft.Extensions.Configuration;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;

namespace ShootMatch.Infrastructure.Persistence;

/// <summary>
/// In-memory ISwipeActionRepository.
///
/// IMPORTANT — data model for mutual check:
///   Customer  swiping on Photographer: CustomerId = customerId,     PhotographerId = photographerId
///   Photographer swiping on Customer:  CustomerId = photographerId, PhotographerId = customerId
///   Direction = "Right" for both.
///
/// DevFeatures:AllowAutoMatch = true (appsettings.Development.json) bypasses the mutual check
/// so the full swipe → match flow can be tested before photographer-side swipe UI is built.
/// </summary>
public sealed class InMemorySwipeActionRepository(IConfiguration configuration) : ISwipeActionRepository
{
    private readonly ConcurrentDictionary<Guid, SwipeAction> _swipes = new();
    private readonly bool _allowAutoMatch =
        string.Equals(configuration["DevFeatures:AllowAutoMatch"], "true",
            StringComparison.OrdinalIgnoreCase);


    public Task SaveAsync(SwipeAction swipe, CancellationToken cancellationToken = default)
    {
        _swipes[swipe.Id] = swipe;
        return Task.CompletedTask;
    }

    /// <summary>
    /// Checks whether the photographer has swiped Right on the given customer.
    ///
    /// Data model: photographer swiping on a customer is stored as:
    ///   CustomerId     = photographerId  (the swiper)
    ///   PhotographerId = customerId      (the swiped-on)
    ///   Direction      = "Right"
    ///
    /// NOTE: In MVP, the photographer-side swipe UI doesn't exist yet.
    /// Until it does, this will always return false (no records = no mutual match).
    /// To unblock end-to-end testing, seed a photographer Right-swipe record via
    /// InMemorySwipeActionRepository.SaveAsync() in test setup, or temporarily
    /// re-enable the stub by setting ALLOW_AUTO_MATCH=true in appsettings.
    ///
    /// TODO (PostgreSQL): query:
    ///   SELECT 1 FROM swipe_actions
    ///   WHERE customer_id = @photographerId
    ///     AND photographer_id = @customerId
    ///     AND direction = 'Right'
    /// </summary>
    public Task<bool> HasPhotographerSwipedRightAsync(
        Guid photographerId,
        Guid customerId,
        CancellationToken cancellationToken = default)
    {
        // Dev bypass: skip mutual check when AllowAutoMatch = true
        if (_allowAutoMatch) return Task.FromResult(true);

        var hasSwiped = _swipes.Values.Any(s =>
            s.CustomerId     == photographerId &&  // photographer is the swiper
            s.PhotographerId == customerId      &&  // customer is being swiped on
            s.Direction      == "Right");

        return Task.FromResult(hasSwiped);
    }
}
