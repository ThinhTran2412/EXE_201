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
}
