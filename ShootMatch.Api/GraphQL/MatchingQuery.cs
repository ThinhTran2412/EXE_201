using HotChocolate;
using HotChocolate.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
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

    /// <summary>
    /// Returns a customer profile by ID — for photographers to view their client's profile (read-only).
    /// Requires photographer authentication.
    /// </summary>
    [Authorize(Roles = new[] { "photographer" })]
    public async Task<CustomerProfile?> CustomerById(
        Guid id,
        [Service] CustomerService customerService,
        CancellationToken cancellationToken)
    {
        return await customerService.GetProfileAsync(id, cancellationToken);
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

    /// <summary>
    /// Searches and filters photographers based on text query, region, budget, package duration, styles/tags, emergency status, location type, age group, group size, and dominant colors.
    /// </summary>
    public async Task<IReadOnlyList<PhotographerMatchCard>> SearchPhotographers(
        string? query,
        string? region,
        decimal? minBudget,
        decimal? maxBudget,
        int? durationHours,
        IReadOnlyList<string>? styles,
        bool? isEmergency,
        LocationType? locationType,
        AgeGroup? ageGroup,
        GroupSize? groupSize,
        string? colorTone,
        [Service] ShootMatch.Infrastructure.Persistence.ShootMatchDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var records = await dbContext.Photographers
            .Include(x => x.PortfolioPhotos)
                .ThenInclude(p => p.Styles)
            .Include(x => x.PortfolioPhotos)
                .ThenInclude(p => p.Concepts)
            .Include(x => x.ServicePackages)
            .Include(x => x.Styles)
            .Include(x => x.Concepts)
            .Include(x => x.Availabilities)
            .AsNoTracking()
            .Where(x => x.DeletedAt == null)
            .ToListAsync(cancellationToken);

        var keywords = new List<string>();
        if (!string.IsNullOrWhiteSpace(query))
        {
            keywords.AddRange(query.ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries));
        }

        var styleKeywords = new List<string>();
        if (styles != null && styles.Count > 0)
        {
            styleKeywords.AddRange(styles.Select(s => s.ToLowerInvariant()));
        }

        // Relative search: Find Styles/Concepts in DB matching keywords
        var matchingStyleIds = new List<Guid>();
        var matchingConceptIds = new List<Guid>();
        if (keywords.Count > 0)
        {
            var allStyles = await dbContext.Styles.Where(s => s.Status == "Approved").ToListAsync(cancellationToken);
            matchingStyleIds = allStyles
                .Where(s => keywords.Any(kw => s.Name.Contains(kw, StringComparison.OrdinalIgnoreCase) || 
                                               s.Keywords.Contains(kw, StringComparison.OrdinalIgnoreCase)))
                .Select(s => s.Id)
                .ToList();

            var allConcepts = await dbContext.Concepts.Where(c => c.Status == "Approved").ToListAsync(cancellationToken);
            matchingConceptIds = allConcepts
                .Where(c => keywords.Any(kw => c.Name.Contains(kw, StringComparison.OrdinalIgnoreCase) || 
                                               c.Keywords.Contains(kw, StringComparison.OrdinalIgnoreCase)))
                .Select(c => c.Id)
                .ToList();
        }

        var results = new List<PhotographerMatchCard>();

        foreach (var p in records)
        {
            // 1. Filter by Region
            if (!string.IsNullOrWhiteSpace(region) && !p.Region.Equals(region, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            // 2. Filter by Emergency/Instant Booking
            if (isEmergency == true)
            {
                if (!p.IsAvailable || !p.AcceptsInstantBooking)
                {
                    continue;
                }
            }

            // 3. Filter by Budget Range
            if (minBudget.HasValue && p.MaxBudget < minBudget.Value)
            {
                continue;
            }
            if (maxBudget.HasValue && p.MinBudget > maxBudget.Value)
            {
                continue;
            }

            // 4. Filter by Package Duration (hours)
            if (durationHours.HasValue)
            {
                var hasMatchingDuration = p.ServicePackages.Any(sp => sp.IsActive && sp.DurationHours == durationHours.Value);
                if (!hasMatchingDuration)
                {
                    continue;
                }
            }

            // 5. Filter by LocationType
            if (locationType.HasValue)
            {
                var hasMatchingLoc = p.ServicePackages.Any(sp => sp.IsActive && sp.LocationType == locationType.Value);
                if (!hasMatchingLoc)
                {
                    continue;
                }
            }

            // 6. Filter by AgeGroup
            if (ageGroup.HasValue)
            {
                var hasMatchingAge = p.ServicePackages.Any(sp => sp.IsActive && sp.AgeGroup == ageGroup.Value);
                if (!hasMatchingAge)
                {
                    continue;
                }
            }

            // 7. Filter by GroupSize
            if (groupSize.HasValue)
            {
                var hasMatchingSize = p.ServicePackages.Any(sp => sp.IsActive && sp.GroupSize == groupSize.Value);
                if (!hasMatchingSize)
                {
                    continue;
                }
            }

            // 8. Filter by Color Tone / Dominant Colors
            if (!string.IsNullOrWhiteSpace(colorTone))
            {
                var hasColorMatch = p.PortfolioPhotos.Any(ph => ph.DominantColors.Contains(colorTone, StringComparison.OrdinalIgnoreCase));
                if (!hasColorMatch)
                {
                    continue;
                }
            }

            // 9. Filter by Style tags (if styles list provided)
            if (styleKeywords.Count > 0)
            {
                var matchesStyle = false;
                foreach (var style in styleKeywords)
                {
                    if (p.Bio.Contains(style, StringComparison.OrdinalIgnoreCase) ||
                        p.Quote.Contains(style, StringComparison.OrdinalIgnoreCase) ||
                        p.Styles.Any(s => s.Name.Contains(style, StringComparison.OrdinalIgnoreCase)) ||
                        p.Concepts.Any(c => c.Name.Contains(style, StringComparison.OrdinalIgnoreCase)) ||
                        p.PortfolioPhotos.Any(ph => ph.Styles.Any(s => s.Name.Contains(style, StringComparison.OrdinalIgnoreCase)) || 
                                                    ph.Concepts.Any(c => c.Name.Contains(style, StringComparison.OrdinalIgnoreCase))) ||
                        p.ServicePackages.Any(sp => sp.Title.Contains(style, StringComparison.OrdinalIgnoreCase) || sp.Description.Contains(style, StringComparison.OrdinalIgnoreCase)))
                    {
                        matchesStyle = true;
                        break;
                    }
                }
                if (!matchesStyle)
                {
                    continue;
                }
            }

            // 10. Text query keyword matching + Relative search
            var keywordMatchCount = 0;
            var relativeMatch = false;
            if (keywords.Count > 0)
            {
                var textToSearch = $"{p.DisplayName} {p.Bio} {p.Quote} {string.Join(" ", p.ServicePackages.Select(sp => $"{sp.Title} {sp.Description}"))}".ToLowerInvariant();
                foreach (var kw in keywords)
                {
                    if (textToSearch.Contains(kw))
                    {
                        keywordMatchCount++;
                    }
                }

                // Check relative match (styles or concepts tagged to photographer or their portfolio photos)
                if (p.Styles.Any(s => matchingStyleIds.Contains(s.Id)) ||
                    p.Concepts.Any(c => matchingConceptIds.Contains(c.Id)) ||
                    p.PortfolioPhotos.Any(ph => ph.Styles.Any(s => matchingStyleIds.Contains(s.Id)) || 
                                                ph.Concepts.Any(c => matchingConceptIds.Contains(c.Id))))
                {
                    relativeMatch = true;
                }

                if (keywordMatchCount == 0 && !relativeMatch)
                {
                    continue;
                }
            }

            // 11. Score Calculation
            double similarity;
            if (keywords.Count > 0)
            {
                var scoreBase = relativeMatch ? 0.8d : 0.7d;
                similarity = scoreBase + Math.Min(0.15d, keywordMatchCount * 0.05d);
            }
            else
            {
                similarity = 0.5d + (new Random(p.Id.GetHashCode()).NextDouble() * 0.25d);
            }

            var premiumBoost = p.IsPremium ? 0.05d : 0d;
            var ratingBoost = (Math.Clamp(p.Rating, 0d, 5d) / 5d) * 0.1d;

            results.Add(new PhotographerMatchCard
            {
                PhotographerId = p.Id,
                DisplayName = p.DisplayName,
                Region = p.Region,
                MinBudget = p.MinBudget,
                MaxBudget = p.MaxBudget,
                Rating = p.Rating,
                IsPremium = p.IsPremium,
                AvatarUrl = p.AvatarUrl,
                SimilarityScore = similarity,
                FinalScore = similarity + premiumBoost + ratingBoost,
                CurrentLatitude = p.CurrentLatitude,
                CurrentLongitude = p.CurrentLongitude,
                PortfolioPhotos = p.PortfolioPhotos.OrderBy(x => x.DisplayOrder).Select(x => x.ImageUrl).ToList()
            });
        }

        return results
            .OrderByDescending(x => x.FinalScore)
            .ThenByDescending(x => x.Rating)
            .ToList();
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

    /// <summary>Returns the authenticated photographer's detailed portfolio photos (including Styles and Concepts).</summary>
    [Authorize(Roles = new[] { "photographer" })]
    public async Task<IReadOnlyList<DetailedPortfolioPhoto>> MyPortfolioPhotos(
        [Service] IHttpContextAccessor httpContextAccessor,
        [Service] ShootMatch.Infrastructure.Persistence.ShootMatchDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var claim = httpContextAccessor.HttpContext?.User.FindFirst("photographer_id")?.Value;
        if (!Guid.TryParse(claim, out var photographerId)) return [];

        var records = await dbContext.PortfolioPhotos
            .Include(x => x.Styles)
            .Include(x => x.Concepts)
            .AsNoTracking()
            .Where(x => x.PhotographerId == photographerId)
            .OrderBy(x => x.DisplayOrder)
            .ToListAsync(cancellationToken);

        return records.Select(p => new DetailedPortfolioPhoto
        {
            Id = p.Id,
            PhotographerId = p.PhotographerId,
            ImageUrl = p.ImageUrl,
            ThumbnailUrl = p.ThumbnailUrl,
            DisplayOrder = p.DisplayOrder,
            IsIndexed = p.IsIndexed,
            DominantColors = p.DominantColors,
            CreatedAt = p.CreatedAt,
            Styles = p.Styles.Select(s => new Style
            {
                Id = s.Id,
                Name = s.Name,
                Description = s.Description,
                Keywords = s.Keywords,
                Status = s.Status,
                CreatedById = s.CreatedById,
                ApprovedById = s.ApprovedById,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt
            }).ToList(),
            Concepts = p.Concepts.Select(c => new Concept
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                Keywords = c.Keywords,
                Status = c.Status,
                CreatedById = c.CreatedById,
                ApprovedById = c.ApprovedById,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            }).ToList()
        }).ToList();
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

    /// <summary>Returns list of styles, optionally filtered by status (Approved, Pending, Rejected).</summary>
    public async Task<IReadOnlyList<Style>> Styles(
        string? status,
        [Service] ShootMatch.Infrastructure.Persistence.ShootMatchDbContext db,
        CancellationToken cancellationToken)
    {
        var query = db.Styles.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(x => x.Status == status);
        }
        else
        {
            query = query.Where(x => x.Status == "Approved");
        }

        var records = await query.ToListAsync(cancellationToken);
        return records.Select(r => new Style
        {
            Id = r.Id,
            Name = r.Name,
            Description = r.Description,
            Keywords = r.Keywords,
            Status = r.Status,
            CreatedById = r.CreatedById,
            ApprovedById = r.ApprovedById,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt
        }).ToList();
    }

    /// <summary>Returns list of concepts, optionally filtered by status (Approved, Pending, Rejected).</summary>
    public async Task<IReadOnlyList<Concept>> Concepts(
        string? status,
        [Service] ShootMatch.Infrastructure.Persistence.ShootMatchDbContext db,
        CancellationToken cancellationToken)
    {
        var query = db.Concepts.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(x => x.Status == status);
        }
        else
        {
            query = query.Where(x => x.Status == "Approved");
        }

        var records = await query.ToListAsync(cancellationToken);
        return records.Select(r => new Concept
        {
            Id = r.Id,
            Name = r.Name,
            Description = r.Description,
            Keywords = r.Keywords,
            Status = r.Status,
            CreatedById = r.CreatedById,
            ApprovedById = r.ApprovedById,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt
        }).ToList();
    }
}
