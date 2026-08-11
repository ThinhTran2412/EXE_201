using GreenDonut;
using Microsoft.EntityFrameworkCore;
using ShootMatch.Domain.Entities;
using ShootMatch.Domain.Aggregates;
using ShootMatch.Infrastructure.Persistence;
using ShootMatch.Infrastructure.Persistence.Entities;

namespace ShootMatch.Api.GraphQL;

public class CustomerDataLoader : BatchDataLoader<Guid, Customer>
{
    private readonly IDbContextFactory<ShootMatchDbContext> _dbContextFactory;

    public CustomerDataLoader(
        IDbContextFactory<ShootMatchDbContext> dbContextFactory,
        IBatchScheduler batchScheduler,
        DataLoaderOptions options)
        : base(batchScheduler, options)
    {
        _dbContextFactory = dbContextFactory;
    }

    protected override async Task<IReadOnlyDictionary<Guid, Customer>> LoadBatchAsync(
        IReadOnlyList<Guid> keys,
        CancellationToken cancellationToken)
    {
        using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        var list = await dbContext.Customers.AsNoTracking()
            .Where(t => keys.Contains(t.Id))
            .ToListAsync(cancellationToken);

        return list.Select(r => new Customer
        {
            Id                 = r.Id,
            DisplayName        = r.DisplayName,
            Phone              = r.Phone,
            Email              = r.Email,
            Region             = r.Region,
            AvatarUrl          = r.AvatarUrl,
            CoverPhotoUrl      = r.CoverPhotoUrl,
            HighlightPhoto1Url = r.HighlightPhoto1Url,
            HighlightPhoto2Url = r.HighlightPhoto2Url,
            HighlightPhoto3Url = r.HighlightPhoto3Url,
            RollPreviewPhotos  = r.RollPreviewPhotos,
            PreferredStyles    = r.PreferredStyles,
            IsVerified         = r.IsVerified,
            IsActive           = r.IsActive,
            PasswordHash       = r.PasswordHash,
            GoogleId           = r.GoogleId,
            PreferredBudgetMin = r.PreferredBudgetMin,
            PreferredBudgetMax = r.PreferredBudgetMax,
            CreatedAt          = r.CreatedAt,
            LastSeenAt         = r.LastSeenAt,
            DeletedAt          = r.DeletedAt,
            MembershipTier     = r.MembershipTier
        }).ToDictionary(t => t.Id);
    }
}

public class PhotographerDataLoader : BatchDataLoader<Guid, Photographer>
{
    private readonly IDbContextFactory<ShootMatchDbContext> _dbContextFactory;

    public PhotographerDataLoader(
        IDbContextFactory<ShootMatchDbContext> dbContextFactory,
        IBatchScheduler batchScheduler,
        DataLoaderOptions options)
        : base(batchScheduler, options)
    {
        _dbContextFactory = dbContextFactory;
    }

    protected override async Task<IReadOnlyDictionary<Guid, Photographer>> LoadBatchAsync(
        IReadOnlyList<Guid> keys,
        CancellationToken cancellationToken)
    {
        using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        var list = await dbContext.Photographers.AsNoTracking()
            .Where(t => keys.Contains(t.Id))
            .ToListAsync(cancellationToken);

        return list.Select(r => new Photographer
        {
            Id                   = r.Id,
            DisplayName          = r.DisplayName,
            Phone                = r.Phone,
            Email                = r.Email,
            Region               = r.Region,
            AvatarUrl            = r.AvatarUrl,
            CoverPhotoUrl        = r.CoverPhotoUrl,
            Bio                  = r.Bio,
            Quote                = r.Quote,
            NationalId           = r.NationalId,
            PersonalAddress      = r.PersonalAddress,
            VerificationDocumentFrontUrl = r.VerificationDocumentFrontUrl,
            VerificationDocumentBackUrl  = r.VerificationDocumentBackUrl,
            VerificationPortraitUrl      = r.VerificationPortraitUrl,
            InstagramUrl         = r.InstagramUrl,
            MinBudget            = r.MinBudget,
            MaxBudget            = r.MaxBudget,
            Rating               = r.Rating,
            IsPremium            = r.IsPremium,
            IsAvailable          = r.IsAvailable,
            AcceptsInstantBooking = r.AcceptsInstantBooking,
            VerificationStatus   = r.VerificationStatus,
            PasswordHash         = r.PasswordHash,
            GoogleId             = r.GoogleId,
            CurrentLatitude      = r.CurrentLatitude,
            CurrentLongitude     = r.CurrentLongitude,
            CreatedAt            = r.CreatedAt,
            UpdatedAt            = r.UpdatedAt,
            DeletedAt            = r.DeletedAt,
            MembershipTier       = r.MembershipTier
        }).ToDictionary(t => t.Id);
    }
}

public class ServicePackageDataLoader : BatchDataLoader<Guid, ServicePackage>
{
    private readonly IDbContextFactory<ShootMatchDbContext> _dbContextFactory;

    public ServicePackageDataLoader(
        IDbContextFactory<ShootMatchDbContext> dbContextFactory,
        IBatchScheduler batchScheduler,
        DataLoaderOptions options)
        : base(batchScheduler, options)
    {
        _dbContextFactory = dbContextFactory;
    }

    protected override async Task<IReadOnlyDictionary<Guid, ServicePackage>> LoadBatchAsync(
        IReadOnlyList<Guid> keys,
        CancellationToken cancellationToken)
    {
        using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        var list = await dbContext.ServicePackages.AsNoTracking()
            .Where(t => keys.Contains(t.Id))
            .ToListAsync(cancellationToken);

        return list.Select(r => new ServicePackage
        {
            Id = r.Id,
            PhotographerId = r.PhotographerId,
            Title = r.Title,
            Subtitle = r.Subtitle,
            Description = r.Description,
            HeroTitle = r.HeroTitle,
            HeroSubtitle = r.HeroSubtitle,
            CallToAction = r.CallToAction,
            Price = r.Price,
            DurationHours = r.DurationHours,
            LocationType = r.LocationType,
            AgeGroup = r.AgeGroup,
            GroupSize = r.GroupSize,
            IsActive = r.IsActive,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt
        }).ToDictionary(t => t.Id);
    }
}

public class ServicePackageImageDataLoader : BatchDataLoader<Guid, string?>
{
    private readonly IDbContextFactory<ShootMatchDbContext> _dbContextFactory;

    public ServicePackageImageDataLoader(
        IDbContextFactory<ShootMatchDbContext> dbContextFactory,
        IBatchScheduler batchScheduler,
        DataLoaderOptions options)
        : base(batchScheduler, options)
    {
        _dbContextFactory = dbContextFactory;
    }

    protected override async Task<IReadOnlyDictionary<Guid, string?>> LoadBatchAsync(
        IReadOnlyList<Guid> keys,
        CancellationToken cancellationToken)
    {
        using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        var mediaList = await dbContext.ServicePackageMedia.AsNoTracking()
            .Where(t => keys.Contains(t.ServicePackageId))
            .ToListAsync(cancellationToken);

        var dict = new Dictionary<Guid, string?>();
        foreach (var key in keys)
        {
            var firstImage = mediaList
                .Where(m => m.ServicePackageId == key)
                .OrderBy(m => m.SortOrder)
                .Select(m => m.ImageUrl)
                .FirstOrDefault();
            dict[key] = firstImage;
        }

        return dict;
    }
}

public class LastMessageDataLoader : BatchDataLoader<Guid, Message?>
{
    private readonly IDbContextFactory<ShootMatchDbContext> _dbContextFactory;

    public LastMessageDataLoader(
        IDbContextFactory<ShootMatchDbContext> dbContextFactory,
        IBatchScheduler batchScheduler,
        DataLoaderOptions options)
        : base(batchScheduler, options)
    {
        _dbContextFactory = dbContextFactory;
    }

    protected override async Task<IReadOnlyDictionary<Guid, Message?>> LoadBatchAsync(
        IReadOnlyList<Guid> keys,
        CancellationToken cancellationToken)
    {
        using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        var latestMessages = await dbContext.Messages.AsNoTracking()
            .Where(m => keys.Contains(m.ConversationId))
            .GroupBy(m => m.ConversationId)
            .Select(g => g.OrderByDescending(m => m.SentAt).FirstOrDefault())
            .ToListAsync(cancellationToken);

        var dict = keys.ToDictionary(k => k, k => (Message?)null);
        foreach (var msg in latestMessages)
        {
            if (msg != null)
            {
                dict[msg.ConversationId] = new Message
                {
                    Id = msg.Id,
                    ConversationId = msg.ConversationId,
                    SenderId = msg.SenderId,
                    SenderRole = msg.SenderRole,
                    Content = msg.Content,
                    ContentType = msg.ContentType,
                    SentAt = msg.SentAt,
                    ReadAt = msg.ReadAt
                };
            }
        }
        return dict;
    }
}
