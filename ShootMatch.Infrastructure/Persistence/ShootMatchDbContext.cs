using Microsoft.EntityFrameworkCore;
using ShootMatch.Domain.Common;
using ShootMatch.Infrastructure.Persistence.Entities;

namespace ShootMatch.Infrastructure.Persistence;

public sealed class ShootMatchDbContext(
    DbContextOptions<ShootMatchDbContext> options,
    DomainEventDispatcher? dispatcher = null) : DbContext(options)
{
    // Existing
    public DbSet<PhotographerRecord> Photographers => Set<PhotographerRecord>();
    public DbSet<PortfolioEmbeddingRecord> PortfolioEmbeddings => Set<PortfolioEmbeddingRecord>();
    public DbSet<CustomerRecord> Customers => Set<CustomerRecord>();
    public DbSet<SearchSessionRecord> SearchSessions => Set<SearchSessionRecord>();
    public DbSet<AuthSessionRecord> AuthSessions => Set<AuthSessionRecord>();
    public DbSet<SwipeActionRecord> SwipeActions => Set<SwipeActionRecord>();

    // New
    public DbSet<PortfolioPhotoRecord> PortfolioPhotos => Set<PortfolioPhotoRecord>();
    public DbSet<ServicePackageRecord> ServicePackages => Set<ServicePackageRecord>();
    public DbSet<MatchRecord> Matches => Set<MatchRecord>();
    public DbSet<BookingRecord> Bookings => Set<BookingRecord>();
    public DbSet<ReviewRecord> Reviews => Set<ReviewRecord>();
    public DbSet<VerificationRequestRecord> VerificationRequests => Set<VerificationRequestRecord>();
    public DbSet<PhotographerAvailabilityRecord> PhotographerAvailabilities => Set<PhotographerAvailabilityRecord>();
    public DbSet<OtpRecordEntry> OtpRecords => Set<OtpRecordEntry>();

    // Conversation & Messaging
    public DbSet<ConversationRecord> Conversations => Set<ConversationRecord>();
    public DbSet<MessageRecord> Messages => Set<MessageRecord>();

    /// <summary>
    /// Saves changes and dispatches domain events from all AggregateRoot instances.
    /// </summary>
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var result = await base.SaveChangesAsync(cancellationToken);

        if (dispatcher is not null)
        {
            var aggregates = ChangeTracker
                .Entries<AggregateRoot>()
                .Where(e => e.Entity.DomainEvents.Count > 0)
                .Select(e => e.Entity);

            await dispatcher.DispatchAsync(aggregates, cancellationToken);
        }

        return result;
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ── Photographer ────────────────────────────────────────────────────
        modelBuilder.Entity<PhotographerRecord>(entity =>
        {
            entity.ToTable("photographers");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.DisplayName).HasMaxLength(200);
            entity.Property(x => x.Phone).HasMaxLength(25);
            entity.Property(x => x.Email).HasMaxLength(200);
            entity.Property(x => x.Region).HasMaxLength(30);
            entity.Property(x => x.AvatarUrl).HasMaxLength(1024);
            entity.Property(x => x.CoverPhotoUrl).HasMaxLength(1024);
            entity.Property(x => x.Bio).HasMaxLength(2000);
            entity.Property(x => x.Quote).HasMaxLength(500);
            entity.Property(x => x.NationalId).HasMaxLength(30);
            entity.Property(x => x.PersonalAddress).HasMaxLength(500);
            entity.Property(x => x.VerificationDocumentFrontUrl).HasMaxLength(1024);
            entity.Property(x => x.VerificationDocumentBackUrl).HasMaxLength(1024);
            entity.Property(x => x.VerificationPortraitUrl).HasMaxLength(1024);
            entity.Property(x => x.InstagramUrl).HasMaxLength(512);
            entity.Property(x => x.MinBudget).HasColumnType("numeric(18,2)");
            entity.Property(x => x.MaxBudget).HasColumnType("numeric(18,2)");
            entity.Property(x => x.VerificationStatus).HasMaxLength(20);
            entity.Property(x => x.PasswordHash).HasMaxLength(100);
            entity.Property(x => x.GoogleId).HasMaxLength(128);
            entity.HasIndex(x => x.Email);           // email login lookup
            entity.HasIndex(x => x.GoogleId);        // google login lookup
            entity.HasMany(x => x.PortfolioEmbeddings)
                .WithOne(x => x.Photographer)
                .HasForeignKey(x => x.PhotographerId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(x => x.PortfolioPhotos)
                .WithOne(x => x.Photographer)
                .HasForeignKey(x => x.PhotographerId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(x => x.ServicePackages)
                .WithOne(x => x.Photographer)
                .HasForeignKey(x => x.PhotographerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── PortfolioEmbedding ───────────────────────────────────────────────
        modelBuilder.Entity<PortfolioEmbeddingRecord>(entity =>
        {
            entity.ToTable("portfolio_embeddings");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.VectorJson).HasColumnType("jsonb");
        });

        // ── PortfolioPhoto ───────────────────────────────────────────────────
        modelBuilder.Entity<PortfolioPhotoRecord>(entity =>
        {
            entity.ToTable("portfolio_photos");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ImageUrl).HasMaxLength(1024);
            entity.Property(x => x.ThumbnailUrl).HasMaxLength(1024);
            entity.HasIndex(x => x.PhotographerId);
        });

        // ── ServicePackage ───────────────────────────────────────────────────
        modelBuilder.Entity<ServicePackageRecord>(entity =>
        {
            entity.ToTable("service_packages");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(200);
            entity.Property(x => x.Description).HasMaxLength(2000);
            entity.Property(x => x.Price).HasColumnType("numeric(18,2)");
            entity.HasIndex(x => x.PhotographerId);
        });

        // ── Customer ────────────────────────────────────────────────────────
        modelBuilder.Entity<CustomerRecord>(entity =>
        {
            entity.ToTable("customers");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.DisplayName).HasMaxLength(200);
            entity.Property(x => x.Phone).HasMaxLength(25);
            entity.Property(x => x.Email).HasMaxLength(200);
            entity.Property(x => x.Region).HasMaxLength(30);
            entity.Property(x => x.AvatarUrl).HasMaxLength(1024);
            entity.Property(x => x.PreferredBudgetMin).HasColumnType("numeric(18,2)");
            entity.Property(x => x.PreferredBudgetMax).HasColumnType("numeric(18,2)");
            entity.Property(x => x.PasswordHash).HasMaxLength(100);
            entity.Property(x => x.GoogleId).HasMaxLength(128);
            entity.HasIndex(x => x.Email);           // email login lookup
            entity.HasIndex(x => x.GoogleId);        // google login lookup
            entity.HasIndex(x => x.Phone);           // phone OTP lookup
        });

        // ── SearchSession ────────────────────────────────────────────────────
        modelBuilder.Entity<SearchSessionRecord>(entity =>
        {
            entity.ToTable("search_sessions");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Region).HasMaxLength(30);
            entity.Property(x => x.Budget).HasColumnType("numeric(18,2)");
            entity.Property(x => x.ReferenceImageUrlsJson).HasColumnType("jsonb");
            entity.Property(x => x.StyleVectorJson).HasColumnType("jsonb");
            entity.Property(x => x.Status).HasMaxLength(20);
            entity.HasIndex(x => x.CustomerId);
        });

        // ── AuthSession ──────────────────────────────────────────────────────
        modelBuilder.Entity<AuthSessionRecord>(entity =>
        {
            entity.ToTable("auth_sessions");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.RefreshToken).HasMaxLength(512);
            entity.Property(x => x.UserAgent).HasMaxLength(512);
            entity.Property(x => x.IpAddress).HasMaxLength(45);
            entity.HasIndex(x => x.RefreshToken).IsUnique();
            entity.HasIndex(x => x.CustomerId);
        });

        // ── SwipeAction ──────────────────────────────────────────────────────
        modelBuilder.Entity<SwipeActionRecord>(entity =>
        {
            entity.ToTable("swipe_actions");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Direction).HasMaxLength(10);
            entity.HasIndex(x => new { x.CustomerId, x.SearchSessionId });
            entity.HasIndex(x => x.PhotographerId);
        });

        // ── Match ────────────────────────────────────────────────────────────
        modelBuilder.Entity<MatchRecord>(entity =>
        {
            entity.ToTable("matches");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Status).HasMaxLength(20);
            entity.HasIndex(x => new { x.CustomerId, x.PhotographerId });
            entity.HasIndex(x => x.SearchSessionId);
        });

        // ── Booking ──────────────────────────────────────────────────────────
        modelBuilder.Entity<BookingRecord>(entity =>
        {
            entity.ToTable("bookings");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Status).HasMaxLength(20);
            entity.Property(x => x.EscrowStatus).HasMaxLength(20);
            entity.Property(x => x.AgreedPrice).HasColumnType("numeric(18,2)");
            entity.Property(x => x.Commission).HasColumnType("numeric(18,2)");
            entity.Property(x => x.CancellationReason).HasMaxLength(1000);
            entity.HasIndex(x => x.CustomerId);
            entity.HasIndex(x => x.PhotographerId);
            entity.HasIndex(x => x.MatchId);
        });

        // ── Review ───────────────────────────────────────────────────────────
        modelBuilder.Entity<ReviewRecord>(entity =>
        {
            entity.ToTable("reviews");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Comment).HasMaxLength(2000);
            entity.HasIndex(x => x.BookingId).IsUnique(); // 1 review per booking
            entity.HasIndex(x => x.TargetPhotographerId);
        });

        // ── VerificationRequest ──────────────────────────────────────────────
        modelBuilder.Entity<VerificationRequestRecord>(entity =>
        {
            entity.ToTable("verification_requests");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.DocumentType).HasMaxLength(50);
            entity.Property(x => x.DocumentImageUrl).HasMaxLength(1024);
            entity.Property(x => x.SelfieUrl).HasMaxLength(1024);
            entity.Property(x => x.Status).HasMaxLength(20);
            entity.Property(x => x.ReviewedBy).HasMaxLength(200);
            entity.HasIndex(x => x.PhotographerId);
        });

        // ── PhotographerAvailability ─────────────────────────────────────────
        modelBuilder.Entity<PhotographerAvailabilityRecord>(entity =>
        {
            entity.ToTable("photographer_availabilities");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.SlotType).HasMaxLength(20);
            // Index for fast calendar lookup: photographer + type
            entity.HasIndex(x => new { x.PhotographerId, x.DayOfWeek });
            entity.HasIndex(x => new { x.PhotographerId, x.SpecificDate });
            entity.HasOne(x => x.Photographer)
                .WithMany(x => x.Availabilities)
                .HasForeignKey(x => x.PhotographerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── OtpRecord ────────────────────────────────────────────────────────
        modelBuilder.Entity<OtpRecordEntry>(entity =>
        {
            entity.ToTable("otp_records");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Phone).HasMaxLength(25);
            entity.Property(x => x.Code).HasMaxLength(10);
            // Lookup by phone to validate OTP
            entity.HasIndex(x => new { x.Phone, x.IsUsed });
            // Cleanup index for expired records
            entity.HasIndex(x => x.ExpiresAt);
        });

        // ── Conversation ─────────────────────────────────────────────────────
        modelBuilder.Entity<ConversationRecord>(entity =>
        {
            entity.ToTable("conversations");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Status).HasMaxLength(20);
            // Inbox queries: find conversations by participant, sorted by last activity
            entity.HasIndex(x => new { x.CustomerId, x.LastMessageAt });
            entity.HasIndex(x => new { x.PhotographerId, x.LastMessageAt });
            entity.HasIndex(x => x.MatchId).IsUnique(); // 1 conversation per match
            entity.HasMany(x => x.Messages)
                .WithOne(x => x.Conversation)
                .HasForeignKey(x => x.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Message ──────────────────────────────────────────────────────────
        modelBuilder.Entity<MessageRecord>(entity =>
        {
            entity.ToTable("messages");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.SenderRole).HasMaxLength(20);
            entity.Property(x => x.ContentType).HasMaxLength(20);
            entity.Property(x => x.Content).HasMaxLength(4000);
            // Primary query pattern: all messages in a conversation, time-ordered
            entity.HasIndex(x => new { x.ConversationId, x.SentAt });
            // Unread messages query
            entity.HasIndex(x => new { x.ConversationId, x.ReadAt });
        });
    }
}
