using HotChocolate;
using HotChocolate.Authorization;
using Microsoft.AspNetCore.Http;
using ShootMatch.Application.Abstractions;
using ShootMatch.Application.Contracts;
using ShootMatch.Application.Queries;
using ShootMatch.Application.Services;
using ShootMatch.Domain.Aggregates;
using ShootMatch.Domain.Entities;

namespace ShootMatch.Api.GraphQL;

/// <summary>
/// GraphQL Query type — all READ operations.
/// Rule: GET/read → GraphQL; POST/write → REST.
///
/// Public:       photographer, photographers, photographerReviews
/// Customer:     swipeFeed, me, myMatches, match, myBookings, booking, myReviews,
///               myConversations, conversation, conversationMessages
/// Photographer: photographerProfile, myMatchesAsPhotographer, myBookingsAsPhotographer,
///               myReviewsReceived, myConversationsAsPhotographer
/// </summary>
public sealed class MatchingQuery
{
    // ── Swipe Feed (Customer) ─────────────────────────────────────────────────

    /// <summary>
    /// Returns ranked photographer cards for a given search session.
    /// Called after POST /api/matching/searches returns a searchId.
    /// </summary>
    public async Task<IReadOnlyList<PhotographerMatchCard>> SwipeFeed(
        Guid searchId,
        [Service] GetSwipeFeedQueryHandler queryHandler,
        CancellationToken cancellationToken)
    {
        return await queryHandler.HandleAsync(new GetSwipeFeedQuery { SearchId = searchId }, cancellationToken);
    }

    // ── Customer Profile ──────────────────────────────────────────────────────

    /// <summary>Returns the authenticated customer's own profile.</summary>
    [Authorize(Roles = new[] { "customer" })]
    public async Task<CustomerProfile?> Me(
        [Service] IHttpContextAccessor httpContextAccessor,
        [Service] CustomerService customerService,
        CancellationToken cancellationToken)
    {
        var claim = httpContextAccessor.HttpContext?.User.FindFirst("customer_id")?.Value;
        if (!Guid.TryParse(claim, out var customerId)) return null;
        return await customerService.GetProfileAsync(customerId, cancellationToken);
    }

    // ── Photographer Public Profile ───────────────────────────────────────────

    /// <summary>
    /// Returns a photographer's public profile (no auth required).
    /// </summary>
    public async Task<Photographer?> Photographer(
        Guid id,
        [Service] IPhotographerRepository photographerRepository,
        CancellationToken cancellationToken)
    {
        return await photographerRepository.GetByIdAsync(id, cancellationToken);
    }

    /// <summary>
    /// Returns all photographers (no auth required — for browse/discovery).
    /// </summary>
    public async Task<IReadOnlyList<Photographer>> Photographers(
        [Service] IPhotographerRepository photographerRepository,
        CancellationToken cancellationToken)
    {
        return await photographerRepository.GetAllAsync(cancellationToken);
    }

    /// <summary>Customer home feed — featured photographer previews + latest portfolio photos.</summary>
    public async Task<CustomerHomeFeed> CustomerHomeFeed(
        [Service] IPhotographerRepository photographerRepository,
        CancellationToken cancellationToken,
        int photosPerPhotographer = 5,
        int latestPhotoLimit = 20)
    {
        return await photographerRepository.GetCustomerHomeFeedAsync(
            photosPerPhotographer,
            latestPhotoLimit,
            cancellationToken);
    }

    // ── Photographer Self-Profile ─────────────────────────────────────────────

    /// <summary>Returns the authenticated photographer's own profile.</summary>
    [Authorize(Roles = new[] { "photographer" })]
    public async Task<Photographer?> PhotographerProfile(
        [Service] IHttpContextAccessor httpContextAccessor,
        [Service] IPhotographerRepository photographerRepository,
        CancellationToken cancellationToken)
    {
        var claim = httpContextAccessor.HttpContext?.User.FindFirst("photographer_id")?.Value;
        if (!Guid.TryParse(claim, out var photographerId)) return null;
        return await photographerRepository.GetByIdAsync(photographerId, cancellationToken);
    }

    // ── Matches ───────────────────────────────────────────────────────────────

    /// <summary>Returns all matches for the authenticated customer.</summary>
    [Authorize(Roles = new[] { "customer" })]
    public async Task<IReadOnlyList<MatchAggregate>> MyMatches(
        [Service] IHttpContextAccessor httpContextAccessor,
        [Service] IMatchRepository matchRepository,
        CancellationToken cancellationToken)
    {
        var claim = httpContextAccessor.HttpContext?.User.FindFirst("customer_id")?.Value;
        if (!Guid.TryParse(claim, out var customerId)) return [];
        return await matchRepository.GetByCustomerIdAsync(customerId, cancellationToken);
    }

    /// <summary>Returns a specific match by ID. Customer or Photographer may query their own match.</summary>
    [Authorize]
    public async Task<MatchAggregate?> Match(
        Guid id,
        [Service] IMatchRepository matchRepository,
        CancellationToken cancellationToken)
    {
        return await matchRepository.GetByIdAsync(id, cancellationToken);
    }

    /// <summary>Returns all matches for the authenticated photographer.</summary>
    [Authorize(Roles = new[] { "photographer" })]
    public async Task<IReadOnlyList<MatchAggregate>> MyMatchesAsPhotographer(
        [Service] IHttpContextAccessor httpContextAccessor,
        [Service] IMatchRepository matchRepository,
        CancellationToken cancellationToken)
    {
        var claim = httpContextAccessor.HttpContext?.User.FindFirst("photographer_id")?.Value;
        if (!Guid.TryParse(claim, out var photographerId)) return [];
        return await matchRepository.GetByPhotographerIdAsync(photographerId, cancellationToken);
    }

    // ── Bookings ──────────────────────────────────────────────────────────────

    /// <summary>Returns all bookings for the authenticated customer.</summary>
    [Authorize(Roles = new[] { "customer" })]
    public async Task<IReadOnlyList<BookingAggregate>> MyBookings(
        [Service] IHttpContextAccessor httpContextAccessor,
        [Service] IBookingRepository bookingRepository,
        CancellationToken cancellationToken)
    {
        var claim = httpContextAccessor.HttpContext?.User.FindFirst("customer_id")?.Value;
        if (!Guid.TryParse(claim, out var customerId)) return [];
        return await bookingRepository.GetByCustomerIdAsync(customerId, cancellationToken);
    }

    /// <summary>Returns a specific booking by ID.</summary>
    [Authorize]
    public async Task<BookingAggregate?> Booking(
        Guid id,
        [Service] IBookingRepository bookingRepository,
        CancellationToken cancellationToken)
    {
        return await bookingRepository.GetByIdAsync(id, cancellationToken);
    }

    /// <summary>Returns all bookings assigned to the authenticated photographer.</summary>
    [Authorize(Roles = new[] { "photographer" })]
    public async Task<IReadOnlyList<BookingAggregate>> MyBookingsAsPhotographer(
        [Service] IHttpContextAccessor httpContextAccessor,
        [Service] IBookingRepository bookingRepository,
        CancellationToken cancellationToken)
    {
        var claim = httpContextAccessor.HttpContext?.User.FindFirst("photographer_id")?.Value;
        if (!Guid.TryParse(claim, out var photographerId)) return [];
        return await bookingRepository.GetByPhotographerIdAsync(photographerId, cancellationToken);
    }

    // ── Reviews ───────────────────────────────────────────────────────────────

    /// <summary>Returns all reviews written by the authenticated customer.</summary>
    [Authorize(Roles = new[] { "customer" })]
    public async Task<IReadOnlyList<Review>> MyReviews(
        [Service] IHttpContextAccessor httpContextAccessor,
        [Service] IReviewRepository reviewRepository,
        CancellationToken cancellationToken)
    {
        var claim = httpContextAccessor.HttpContext?.User.FindFirst("customer_id")?.Value;
        if (!Guid.TryParse(claim, out var customerId)) return [];
        return await reviewRepository.GetByCustomerIdAsync(customerId, cancellationToken);
    }

    /// <summary>Returns all reviews received by the authenticated photographer.</summary>
    [Authorize(Roles = new[] { "photographer" })]
    public async Task<IReadOnlyList<Review>> MyReviewsReceived(
        [Service] IHttpContextAccessor httpContextAccessor,
        [Service] IReviewRepository reviewRepository,
        CancellationToken cancellationToken)
    {
        var claim = httpContextAccessor.HttpContext?.User.FindFirst("photographer_id")?.Value;
        if (!Guid.TryParse(claim, out var photographerId)) return [];
        return await reviewRepository.GetByPhotographerIdAsync(photographerId, cancellationToken);
    }

    /// <summary>Returns all reviews for a photographer (public).</summary>
    public async Task<IReadOnlyList<Review>> PhotographerReviews(
        Guid photographerId,
        [Service] IReviewRepository reviewRepository,
        CancellationToken cancellationToken)
    {
        return await reviewRepository.GetByPhotographerIdAsync(photographerId, cancellationToken);
    }

    // ── Conversations (Customer) ───────────────────────────────────────────────

    /// <summary>
    /// Returns all conversations for the authenticated customer, ordered by most recent message.
    /// </summary>
    [Authorize(Roles = new[] { "customer" })]
    public async Task<IReadOnlyList<Conversation>> MyConversations(
        [Service] IHttpContextAccessor httpContextAccessor,
        [Service] IConversationRepository conversationRepository,
        CancellationToken cancellationToken)
    {
        var claim = httpContextAccessor.HttpContext?.User.FindFirst("customer_id")?.Value;
        if (!Guid.TryParse(claim, out var customerId)) return [];
        return await conversationRepository.GetConversationsByCustomerIdAsync(customerId, cancellationToken);
    }

    // ── Conversations (Photographer) ──────────────────────────────────────────

    /// <summary>
    /// Returns all conversations for the authenticated photographer, ordered by most recent message.
    /// </summary>
    [Authorize(Roles = new[] { "photographer" })]
    public async Task<IReadOnlyList<Conversation>> MyConversationsAsPhotographer(
        [Service] IHttpContextAccessor httpContextAccessor,
        [Service] IConversationRepository conversationRepository,
        CancellationToken cancellationToken)
    {
        var claim = httpContextAccessor.HttpContext?.User.FindFirst("photographer_id")?.Value;
        if (!Guid.TryParse(claim, out var photographerId)) return [];
        return await conversationRepository.GetConversationsByPhotographerIdAsync(photographerId, cancellationToken);
    }

    // ── Conversation Detail (both roles) ─────────────────────────────────────

    /// <summary>
    /// Returns a single conversation by ID.
    /// Both Customer and Photographer may query their own conversations.
    /// </summary>
    [Authorize]
    public async Task<Conversation?> Conversation(
        Guid id,
        [Service] IConversationRepository conversationRepository,
        CancellationToken cancellationToken)
    {
        return await conversationRepository.GetConversationByIdAsync(id, cancellationToken);
    }

    /// <summary>
    /// Returns all messages in a conversation, ordered oldest-first.
    /// Caller must be a participant — enforce this in the client or add a query middleware.
    /// </summary>
    [Authorize]
    public async Task<IReadOnlyList<Message>> ConversationMessages(
        Guid conversationId,
        [Service] IConversationRepository conversationRepository,
        CancellationToken cancellationToken)
    {
        return await conversationRepository.GetMessagesAsync(conversationId, cancellationToken);
    }
}
