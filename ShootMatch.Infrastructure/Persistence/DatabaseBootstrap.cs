using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ShootMatch.Infrastructure.Persistence;

/// <summary>
/// Applies pending EF migrations and ensures call_sessions exists (legacy DBs used EnsureCreated).
/// </summary>
public static class DatabaseBootstrap
{
    public static async Task ApplyAsync(ShootMatchDbContext db, ILogger logger, CancellationToken cancellationToken = default)
    {
        var pending = (await db.Database.GetPendingMigrationsAsync(cancellationToken)).ToList();
        if (pending.Count > 0)
        {
            logger.LogInformation("Applying {Count} pending migration(s): {Names}",
                pending.Count, string.Join(", ", pending));
            await db.Database.MigrateAsync(cancellationToken);
        }

        await EnsureCallSessionsTableAsync(db, logger, cancellationToken);
        await EnsureChatMediaAndNotificationsAsync(db, logger, cancellationToken);
        await EnsureBookingFieldsAsync(db, logger, cancellationToken);
        await EnsureStylesAndConceptsSeededAsync(db, logger, cancellationToken);
    }

    private static async Task EnsureCallSessionsTableAsync(
        ShootMatchDbContext db,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        try
        {
            await db.Database.ExecuteSqlRawAsync(
                """
                CREATE TABLE IF NOT EXISTS call_sessions (
                    "Id" uuid NOT NULL,
                    "ConversationId" uuid NOT NULL,
                    "CallType" character varying(20) NOT NULL,
                    "Status" character varying(20) NOT NULL,
                    "InitiatorId" uuid NOT NULL,
                    "InitiatorRole" character varying(20) NOT NULL,
                    "StartedAt" timestamp with time zone NOT NULL,
                    "AnsweredAt" timestamp with time zone,
                    "EndedAt" timestamp with time zone,
                    "EndReason" character varying(1000),
                    "SessionToken" character varying(256),
                    "LastSignalAt" timestamp with time zone,
                    CONSTRAINT "PK_call_sessions" PRIMARY KEY ("Id"),
                    CONSTRAINT "FK_call_sessions_conversations_ConversationId"
                        FOREIGN KEY ("ConversationId") REFERENCES conversations ("Id") ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS "IX_call_sessions_ConversationId_StartedAt"
                    ON call_sessions ("ConversationId", "StartedAt");
                CREATE INDEX IF NOT EXISTS "IX_call_sessions_ConversationId_Status"
                    ON call_sessions ("ConversationId", "Status");
                """,
                cancellationToken);

            await db.Database.ExecuteSqlRawAsync(
                """
                INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
                VALUES ('20260520203216_ContactRealtimeFoundation', '9.0.10')
                ON CONFLICT ("MigrationId") DO NOTHING;
                """,
                cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "call_sessions bootstrap skipped (table may already exist with different schema).");
        }
    }

    private static async Task EnsureChatMediaAndNotificationsAsync(
        ShootMatchDbContext db,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        try
        {
            await db.Database.ExecuteSqlRawAsync(
                """
                ALTER TABLE messages ADD COLUMN IF NOT EXISTS "MediaPreviewUrl" character varying(4000);
                ALTER TABLE messages ADD COLUMN IF NOT EXISTS "MediaExpiresAt" timestamp with time zone;
                ALTER TABLE messages ADD COLUMN IF NOT EXISTS "MediaDowngraded" boolean NOT NULL DEFAULT false;

                CREATE TABLE IF NOT EXISTS app_notifications (
                    "Id" uuid NOT NULL,
                    "RecipientId" uuid NOT NULL,
                    "RecipientRole" character varying(20) NOT NULL,
                    "Category" character varying(30) NOT NULL,
                    "Title" character varying(200) NOT NULL,
                    "Body" character varying(2000) NOT NULL,
                    "PayloadJson" jsonb,
                    "ActionType" character varying(50),
                    "CreatedAt" timestamp with time zone NOT NULL,
                    "ReadAt" timestamp with time zone,
                    CONSTRAINT "PK_app_notifications" PRIMARY KEY ("Id")
                );
                CREATE INDEX IF NOT EXISTS "IX_app_notifications_RecipientId_RecipientRole_CreatedAt"
                    ON app_notifications ("RecipientId", "RecipientRole", "CreatedAt" DESC);
                CREATE INDEX IF NOT EXISTS "IX_app_notifications_RecipientId_RecipientRole_ReadAt"
                    ON app_notifications ("RecipientId", "RecipientRole", "ReadAt");
                CREATE INDEX IF NOT EXISTS "IX_messages_ContentType_MediaExpiresAt_MediaDowngraded"
                    ON messages ("ContentType", "MediaExpiresAt", "MediaDowngraded");
                """,
                cancellationToken);

            await db.Database.ExecuteSqlRawAsync(
                """
                INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
                VALUES ('20260522120000_ChatMediaAndNotifications', '9.0.10')
                ON CONFLICT ("MigrationId") DO NOTHING;
                """,
                cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "chat media / notifications bootstrap skipped.");
        }
    }

    private static async Task EnsureBookingFieldsAsync(
        ShootMatchDbContext db,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        try
        {
            await db.Database.ExecuteSqlRawAsync(
                """
                ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "Phone" character varying(50);
                ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "Location" character varying(500);
                ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "Note" character varying(2000);
                ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "Requirements" character varying(2000);
                """,
                cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "bookings fields bootstrap alteration skipped.");
        }
    }

    private static async Task EnsureStylesAndConceptsSeededAsync(
        ShootMatchDbContext db,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        try
        {
            var stylesCount = await db.Styles.CountAsync(cancellationToken);
            if (stylesCount == 0)
            {
                logger.LogInformation("Seeding default styles...");
                var defaultStyles = new List<Entities.StyleRecord>
                {
                    new() { Id = Guid.Parse("b114d334-0803-4f93-b67f-82db23719001"), Name = "Vintage", Description = "Phong cách cổ điển, hoài niệm", Keywords = "vintage, retro, classic, hoai co, co dien", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new() { Id = Guid.Parse("b114d334-0803-4f93-b67f-82db23719002"), Name = "Portrait", Description = "Chụp ảnh chân dung tập trung vào gương mặt", Keywords = "portrait, chan dung, mat, face", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new() { Id = Guid.Parse("b114d334-0803-4f93-b67f-82db23719003"), Name = "Editorial", Description = "Phong cách thời trang tạp chí cao cấp", Keywords = "editorial, fashion, magazine, tap chi, thoi trang", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new() { Id = Guid.Parse("b114d334-0803-4f93-b67f-82db23719004"), Name = "Streetwear", Description = "Thời trang đường phố năng động, tự nhiên", Keywords = "streetwear, street, duong pho, nang dong, bui bam", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new() { Id = Guid.Parse("b114d334-0803-4f93-b67f-82db23719005"), Name = "Minimalist", Description = "Phong cách tối giản, tinh tế", Keywords = "minimalist, minimal, toi gian, tinh te", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new() { Id = Guid.Parse("b114d334-0803-4f93-b67f-82db23719006"), Name = "Film Look", Description = "Màu film mơ màng hoài cổ", Keywords = "film, film look, mau film, mo mang, tho tho", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new() { Id = Guid.Parse("b114d334-0803-4f93-b67f-82db23719007"), Name = "Cyberpunk", Description = "Tương lai viễn tưởng, ánh sáng neon", Keywords = "cyberpunk, neon, tuong lai, sci-fi", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new() { Id = Guid.Parse("b114d334-0803-4f93-b67f-82db23719008"), Name = "Black and White", Description = "Ảnh đen trắng nghệ thuật", Keywords = "black and white, bnw, den trang, monochrome", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
                };

                await db.Styles.AddRangeAsync(defaultStyles, cancellationToken);
                await db.SaveChangesAsync(cancellationToken);
            }

            var conceptsCount = await db.Concepts.CountAsync(cancellationToken);
            if (conceptsCount == 0)
            {
                logger.LogInformation("Seeding default concepts...");
                var defaultConcepts = new List<Entities.ConceptRecord>
                {
                    new() { Id = Guid.Parse("c114d334-0803-4f93-b67f-82db23719001"), Name = "Wedding", Description = "Ảnh cưới cô dâu chú rể ngoại cảnh hoặc studio", Keywords = "wedding, cuoi, dam cuoi, co dau, chu re", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new() { Id = Guid.Parse("c114d334-0803-4f93-b67f-82db23719002"), Name = "Couple", Description = "Chụp ảnh đôi tình nhân, bạn bè", Keywords = "couple, doi, cap doi, tinh nhan", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new() { Id = Guid.Parse("c114d334-0803-4f93-b67f-82db23719003"), Name = "Family", Description = "Ảnh gia đình đầm ấm", Keywords = "family, gia dinh, bo me, con cai", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new() { Id = Guid.Parse("c114d334-0803-4f93-b67f-82db23719004"), Name = "Newborn", Description = "Ảnh sơ sinh và em bé nhỏ", Keywords = "newborn, baby, em be, so sinh", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new() { Id = Guid.Parse("c114d334-0803-4f93-b67f-82db23719005"), Name = "Gen Z", Description = "Phong cách trẻ trung, năng động của thế hệ mới", Keywords = "gen z, tre trung, ca tinh, doc dao", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new() { Id = Guid.Parse("c114d334-0803-4f93-b67f-82db23719006"), Name = "Corporate / Profile", Description = "Ảnh chân dung doanh nhân, hồ sơ cá nhân chuyên nghiệp", Keywords = "corporate, profile, doanh nhan, headshot", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new() { Id = Guid.Parse("c114d334-0803-4f93-b67f-82db23719007"), Name = "Lookbook", Description = "Thời trang sản phẩm, bán hàng thương mại", Keywords = "lookbook, fashion, san pham, ban hang, clothing", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new() { Id = Guid.Parse("c114d334-0803-4f93-b67f-82db23719008"), Name = "Graduation", Description = "Kỷ yếu tốt nghiệp học sinh sinh viên", Keywords = "graduation, ky yeu, tot nghiep, hoc sinh, sinh vien", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
                };

                await db.Concepts.AddRangeAsync(defaultConcepts, cancellationToken);
                await db.SaveChangesAsync(cancellationToken);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Styles and concepts database seeding skipped.");
        }
    }
}
