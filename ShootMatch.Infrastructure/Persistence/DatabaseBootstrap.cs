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
        await EnsureMembershipTiersAsync(db, logger, cancellationToken);
        await EnsureStylesAndConceptsSeededAsync(db, logger, cancellationToken);
        await EnsureAdminAccountsSeededAsync(db, logger, cancellationToken);
        await MigrateExistingPreferredStylesAsync(db, logger, cancellationToken);
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

    private static async Task EnsureMembershipTiersAsync(
        ShootMatchDbContext db,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Ensuring membership tiers fields and plans exist in database...");
            
            // Add column to customers and photographers
            await db.Database.ExecuteSqlRawAsync(
                """
                ALTER TABLE customers ADD COLUMN IF NOT EXISTS "MembershipTier" character varying(50) NOT NULL DEFAULT 'Lướt Nhẹ';
                ALTER TABLE photographers ADD COLUMN IF NOT EXISTS "MembershipTier" character varying(50) NOT NULL DEFAULT 'Basic';
                """,
                cancellationToken);

            // Create membership_plans table if not exists
            await db.Database.ExecuteSqlRawAsync(
                """
                CREATE TABLE IF NOT EXISTS membership_plans (
                    "Id" character varying(50) NOT NULL,
                    "Name" character varying(100) NOT NULL,
                    "TargetRole" character varying(20) NOT NULL,
                    "PriceMonthly" numeric(18,2) NOT NULL,
                    "PriceSixMonths" numeric(18,2) NOT NULL,
                    "PriceYearly" numeric(18,2) NOT NULL,
                    "SavingSixMonths" character varying(200),
                    "SavingYearly" character varying(200),
                    "Description" character varying(1000),
                    "FeaturesJson" character varying(4000) NOT NULL,
                    CONSTRAINT "PK_membership_plans" PRIMARY KEY ("Id")
                );
                """,
                cancellationToken);

            // Create membership_orders table if not exists
            await db.Database.ExecuteSqlRawAsync(
                """
                CREATE TABLE IF NOT EXISTS membership_orders (
                    "OrderCode" bigint NOT NULL,
                    "UserId" uuid NOT NULL,
                    "UserRole" character varying(20) NOT NULL,
                    "PlanId" character varying(50) NOT NULL,
                    "Cycle" character varying(20) NOT NULL,
                    "Amount" numeric(18,2) NOT NULL,
                    "Status" character varying(20) NOT NULL DEFAULT 'Pending',
                    "CreatedAt" timestamp with time zone NOT NULL,
                    CONSTRAINT "PK_membership_orders" PRIMARY KEY ("OrderCode")
                );
                """,
                cancellationToken);

            // Add banking details columns to membership_orders if not exists
            await db.Database.ExecuteSqlRawAsync(
                """
                ALTER TABLE membership_orders ADD COLUMN IF NOT EXISTS "CounterAccountBankName" character varying(200);
                ALTER TABLE membership_orders ADD COLUMN IF NOT EXISTS "CounterAccountName" character varying(200);
                ALTER TABLE membership_orders ADD COLUMN IF NOT EXISTS "CounterAccountNumber" character varying(100);
                """,
                cancellationToken);

            // Seed membership plans
            await db.Database.ExecuteSqlRawAsync(
                """
                INSERT INTO membership_plans ("Id", "Name", "TargetRole", "PriceMonthly", "PriceSixMonths", "PriceYearly", "SavingSixMonths", "SavingYearly", "Description", "FeaturesJson")
                VALUES 
                ('luot_nhe', 'Lướt Nhẹ', 'customer', 0, 0, 0, '', '', 'Mới gia nhập, tìm hiểu dịch vụ', '["Hiển thị 5 ảnh portfolio", "Bộ lọc cơ bản (Khu vực, phong cách, giá)", "Nhận tối đa 10 lượt quẹt/ngày"]'),
                ('chon_xinh', 'Chọn Xinh', 'customer', 99000, 529000, 990000, 'Tiết kiệm khoảng 65.000 VNĐ', 'Tiết kiệm khoảng 198.000 VNĐ', 'Phù hợp với nhu cầu chụp ảnh định kỳ', '["Hiển thị 15 ảnh portfolio", "Mở rộng bộ lọc nâng cao", "Ưu tiên hiển thị feedback chi tiết", "Gợi ý thông minh"]'),
                ('chot_xin', 'Chốt Xịn', 'customer', 199000, 1050000, 1990000, 'Tiết kiệm khoảng 144.000 VNĐ', 'Tiết kiệm khoảng 398.000 VNĐ', 'Trải nghiệm tối đa tính năng', '["Xem không giới hạn portfolio", "Bộ lọc chuyên sâu", "Số liệu phản hồi & tỷ lệ hoàn thành", "Hỗ trợ kết nối ưu tiên", "Quẹt không giới hạn"]'),
                ('basic', 'Basic', 'photographer', 0, 0, 0, '', '', 'Photographer mới gia nhập', '["Tối đa 20 ảnh portfolio", "Hiển thị tìm kiếm tiêu chuẩn", "Nhận yêu cầu booking giới hạn", "Lịch chụp cơ bản", "Hỗ trợ qua email"]'),
                ('pro', 'Pro', 'photographer', 299000, 1650000, 2990000, 'Tiết kiệm khoảng 144.000 VNĐ', 'Tiết kiệm khoảng 598.000 VNĐ', 'Photographer hoạt động thường xuyên', '["Không giới hạn ảnh portfolio", "1 video giới thiệu bản thân", "Ưu tiên hiển thị tìm kiếm", "Đề xuất ở mục Recommended", "Nhận booking không giới hạn", "Mở khóa thống kê lượt xem & lượt quẹt"]'),
                ('studio_plus', 'Studio+', 'photographer', 699000, 3850000, 6990000, 'Tiết kiệm khoảng 344.000 VNĐ', 'Tiết kiệm khoảng 1.398.000 VNĐ', 'Studio / photographer chuyên nghiệp', '["Không giới hạn ảnh portfolio", "Nhiều video giới thiệu bản thân", "Thứ hạng tìm kiếm cao nhất", "Đề xuất Recommended", "Thống kê chi tiết nâng cao", "Hỗ trợ ưu tiên khẩn cấp"]')
                ON CONFLICT ("Id") DO UPDATE SET
                    "Name" = EXCLUDED."Name",
                    "PriceMonthly" = EXCLUDED."PriceMonthly",
                    "PriceSixMonths" = EXCLUDED."PriceSixMonths",
                    "PriceYearly" = EXCLUDED."PriceYearly",
                    "SavingSixMonths" = EXCLUDED."SavingSixMonths",
                    "SavingYearly" = EXCLUDED."SavingYearly",
                    "Description" = EXCLUDED."Description",
                    "FeaturesJson" = EXCLUDED."FeaturesJson";
                """,
                cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "customers / photographers membership tiers and plans database alteration skipped.");
        }
    }

    private static async Task EnsureStylesAndConceptsSeededAsync(
        ShootMatchDbContext db,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Ensuring default styles are seeded...");
            var defaultStyles = new List<Entities.StyleRecord>
            {
                new() { Id = Guid.Parse("b114d334-0803-4f93-b67f-82db23719001"), Name = "Vintage", Description = "Phong cách cổ điển, hoài niệm", Keywords = "vintage, retro, classic, hoai co, co dien", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = Guid.Parse("b114d334-0803-4f93-b67f-82db23719002"), Name = "Portrait", Description = "Chụp ảnh chân dung tập trung vào gương mặt", Keywords = "portrait, chan dung, mat, face", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = Guid.Parse("b114d334-0803-4f93-b67f-82db23719003"), Name = "Editorial", Description = "Phong cách thời trang tạp chí cao cấp", Keywords = "editorial, fashion, magazine, tap chi, thoi trang", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = Guid.Parse("b114d334-0803-4f93-b67f-82db23719004"), Name = "Streetwear", Description = "Thời trang đường phố năng động, tự nhiên", Keywords = "streetwear, street, duong pho, nang dong, bui bam", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = Guid.Parse("b114d334-0803-4f93-b67f-82db23719005"), Name = "Minimalist", Description = "Phong cách tối giản, tinh tế", Keywords = "minimalist, minimal, toi gian, tinh te", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = Guid.Parse("b114d334-0803-4f93-b67f-82db23719006"), Name = "Film Look", Description = "Màu film mơ màng hoài cổ", Keywords = "film, film look, mau film, mo mang, tho tho", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = Guid.Parse("b114d334-0803-4f93-b67f-82db23719007"), Name = "Cyberpunk", Description = "Tương lai viễn tưởng, ánh sáng neon", Keywords = "cyberpunk, neon, tuong lai, sci-fi", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = Guid.Parse("b114d334-0803-4f93-b67f-82db23719008"), Name = "Black and White", Description = "Ảnh đen trắng nghệ thuật", Keywords = "black and white, bnw, den trang, monochrome", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = Guid.Parse("b114d334-0803-4f93-b67f-82db23719009"), Name = "Korean Style", Description = "Phong cách Hàn Quốc ngọt ngào, tone màu pastel nhẹ nhàng", Keywords = "han quoc, korean, soft, pastel, nhe nhang, trong treo", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = Guid.Parse("b114d334-0803-4f93-b67f-82db23719010"), Name = "Cổ Trang", Description = "Phong cách cổ trang, Việt phục, cổ phục truyền thống", Keywords = "co trang, viet phuc, co trang trung quoc, truyen thong", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = Guid.Parse("b114d334-0803-4f93-b67f-82db23719011"), Name = "Retro 90s", Description = "Phong cách Hong Kong thập niên 90 hoài cổ, quyến rũ", Keywords = "retro, 90s, hong kong, neon light, xua cu", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = Guid.Parse("b114d334-0803-4f93-b67f-82db23719012"), Name = "Cinematic", Description = "Tone màu điện ảnh cinematic, có chiều sâu", Keywords = "cinematic, dien anh, movie, thuoc phim, deep", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = Guid.Parse("b114d334-0803-4f93-b67f-82db23719013"), Name = "Bohemian", Description = "Phong cách Bohemian tự do, hoang dã và du mục", Keywords = "boho, bohemian, tu do, hoang da, du muc", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = Guid.Parse("b114d334-0803-4f93-b67f-82db23719014"), Name = "Fairy Tale", Description = "Phong cách cổ tích, thần thoại, mộng mơ bay bổng", Keywords = "fairy, fairy tale, than thoai, than tien, cong chua", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = Guid.Parse("b114d334-0803-4f93-b67f-82db23719015"), Name = "Landscape", Description = "Phong cách chụp phong cảnh, thiên nhiên, mây trời hùng vĩ", Keywords = "landscape, phong canh, thien nhien, may troi, nui rung", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = Guid.Parse("b114d334-0803-4f93-b67f-82db23719016"), Name = "Architecture", Description = "Phong cách chụp ảnh kiến trúc, không gian nhà ở, công trình xây dựng", Keywords = "architecture, kien truc, noi that, khong gian, nha cua, building", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
            };

            foreach (var style in defaultStyles)
            {
                var exists = await db.Styles.AnyAsync(s => s.Id == style.Id || s.Name == style.Name, cancellationToken);
                if (!exists)
                {
                    await db.Styles.AddAsync(style, cancellationToken);
                }
            }
            await db.SaveChangesAsync(cancellationToken);

            logger.LogInformation("Ensuring default concepts are seeded...");
            var defaultConcepts = new List<Entities.ConceptRecord>
            {
                new() { Id = Guid.Parse("c114d334-0803-4f93-b67f-82db23719001"), Name = "Wedding", Description = "Ảnh cưới cô dâu chú rể ngoại cảnh hoặc studio", Keywords = "wedding, cuoi, dam cuoi, co dau, chu re", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = Guid.Parse("c114d334-0803-4f93-b67f-82db23719002"), Name = "Couple", Description = "Chụp ảnh đôi tình nhân, bạn bè", Keywords = "couple, doi, cap doi, tinh nhan", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = Guid.Parse("c114d334-0803-4f93-b67f-82db23719003"), Name = "Family", Description = "Ảnh gia đình đầm ấm", Keywords = "family, gia dinh, bo me, con cai", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = Guid.Parse("c114d334-0803-4f93-b67f-82db23719004"), Name = "Newborn", Description = "Ảnh sơ sinh và em bé nhỏ", Keywords = "newborn, baby, em be, so sinh", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = Guid.Parse("c114d334-0803-4f93-b67f-82db23719005"), Name = "Gen Z", Description = "Phong cách trẻ trung, năng động của thế hệ mới", Keywords = "gen z, tre trung, ca tinh, doc dao", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = Guid.Parse("c114d334-0803-4f93-b67f-82db23719006"), Name = "Corporate / Profile", Description = "Ảnh chân dung doanh nhân, hồ sơ cá nhân chuyên nghiệp", Keywords = "corporate, profile, doanh nhan, headshot", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = Guid.Parse("c114d334-0803-4f93-b67f-82db23719007"), Name = "Lookbook", Description = "Thời trang sản phẩm, bán hàng thương mại", Keywords = "lookbook, fashion, san pham, ban hang, clothing", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = Guid.Parse("c114d334-0803-4f93-b67f-82db23719008"), Name = "Graduation", Description = "Kỷ yếu tốt nghiệp học sinh sinh viên", Keywords = "graduation, ky yeu, tot nghiep, hoc sinh, sinh vien", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = Guid.Parse("c114d334-0803-4f93-b67f-82db23719009"), Name = "Giáng Sinh", Description = "Chụp ảnh chủ đề Noel, ấm cúng và lung linh ánh đèn", Keywords = "christmas, noel, giang sinh, mua dong", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = Guid.Parse("c114d334-0803-4f93-b67f-82db23719010"), Name = "Tết Cổ Truyền", Description = "Chụp ảnh Tết cổ truyền với áo dài, nón lá, không khí mùa xuân", Keywords = "tet, xuan, ao dai, hoa mai, hoa dao", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = Guid.Parse("c114d334-0803-4f93-b67f-82db23719011"), Name = "Party / Sự Kiện", Description = "Ghi lại những khoảnh khắc vui vẻ tại tiệc sinh nhật, sự kiện", Keywords = "party, event, sinh nhat, sukien, tiec tung", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = Guid.Parse("c114d334-0803-4f93-b67f-82db23719012"), Name = "Nude / Boudoir", Description = "Phong cách quyến rũ, nghệ thuật tôn vinh vẻ đẹp hình thể", Keywords = "nude, boudoir, quyen ru, goi cam, nghe thuat", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = Guid.Parse("c114d334-0803-4f93-b67f-82db23719013"), Name = "Thanh Xuân", Description = "Concept thanh xuân học đường, đồng phục học sinh trong sáng", Keywords = "thanh xuan, dong phuc, hoc duong, tuoi tre, hoc sinh", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = Guid.Parse("c114d334-0803-4f93-b67f-82db23719014"), Name = "Street Food", Description = "Concept đời thường, dạo phố và ăn uống tại các quán xá vỉa hè", Keywords = "street food, quan xa, an uong, doi thuong, pho xa", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = Guid.Parse("c114d334-0803-4f93-b67f-82db23719015"), Name = "Product / Food", Description = "Concept chụp ảnh sản phẩm, món ăn, đồ uống phục vụ quảng cáo và kinh doanh", Keywords = "product, food, san pham, do an, mon an, quang cao, menu", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = Guid.Parse("c114d334-0803-4f93-b67f-82db23719016"), Name = "Nature / Travel", Description = "Concept chụp ảnh dã ngoại, cắm trại, hành trình du lịch khám phá thiên nhiên", Keywords = "nature, travel, du lich, cam trai, da ngoai, phuot, thien nhien", Status = "Approved", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
            };

            foreach (var concept in defaultConcepts)
            {
                var exists = await db.Concepts.AnyAsync(c => c.Id == concept.Id || c.Name == concept.Name, cancellationToken);
                if (!exists)
                {
                    await db.Concepts.AddAsync(concept, cancellationToken);
                }
            }
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Styles and concepts database seeding skipped.");
        }
    }

    private static async Task EnsureAdminAccountsSeededAsync(
        ShootMatchDbContext db,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Ensuring admin accounts are seeded...");
            var adminEmails = new[] { "thinhtt2412@gmail.com" };
            foreach (var email in adminEmails)
            {
                var exists = await db.Staffs.AnyAsync(s => s.Email == email, cancellationToken);
                if (!exists)
                {
                    // For the passwords from 1 to 8: 12345678
                    var passwordHash = BCrypt.Net.BCrypt.HashPassword("12345678", 10);
                    var newAdmin = new Entities.StaffRecord
                    {
                        Id = Guid.NewGuid(),
                        DisplayName = "Admin Thinh",
                        Email = email,
                        Role = "admin",
                        ApprovalStatus = "Approved",
                        PasswordHash = passwordHash,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        ApprovedAt = DateTime.UtcNow,
                        Phone = "0999999999"
                    };
                    await db.Staffs.AddAsync(newAdmin, cancellationToken);
                }
            }
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Admin accounts database seeding skipped.");
        }
    }

    private static async Task MigrateExistingPreferredStylesAsync(
        ShootMatchDbContext db,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Checking and cleaning up JSON PreferredStyles fields in database...");

            var customers = await db.Customers
                .Where(c => c.PreferredStyles.Contains("{") && c.PreferredStyles.Contains("}"))
                .ToListAsync(cancellationToken);

            if (customers.Count == 0)
            {
                logger.LogInformation("No customer PreferredStyles need cleanup.");
                return;
            }

            logger.LogInformation("Found {Count} customer(s) with JSON preferred styles. Cleaning them up...", customers.Count);

            var styles = await db.Styles.AsNoTracking().ToListAsync(cancellationToken);
            var concepts = await db.Concepts.AsNoTracking().ToListAsync(cancellationToken);

            var styleMap = styles.ToDictionary(s => s.Id, s => s.Name);
            var conceptMap = concepts.ToDictionary(c => c.Id, c => c.Name);

            var locationMapping = new Dictionary<string, string>
            {
                { "cafe", "Quán Cafe" },
                { "studio", "Studio" },
                { "home", "Tại nhà" },
                { "museum", "Bảo tàng" },
                { "park", "Công viên" },
                { "urban", "Đường phố/Urban" },
                { "beach", "Bãi biển" },
                { "rooftop", "Sân thượng" },
                { "landmark", "Landmark/Cầu" },
                { "historical", "Di tích/Phố cổ" },
                { "abandoned", "Nhà hoang" },
                { "westlake", "Hồ Tây/Sunset" }
            };

            var colorMapping = new Dictionary<string, string>
            {
                { "warm", "Tone Ấm" },
                { "cool", "Tone Lạnh" },
                { "bright", "Pastel Tone" },
                { "mono", "Đen Trắng" },
                { "earthy", "Tone Đất" },
                { "cyber", "Neon Cyber" }
            };

            foreach (var customer in customers)
            {
                try
                {
                    using var doc = System.Text.Json.JsonDocument.Parse(customer.PreferredStyles);
                    var root = doc.RootElement;
                    var tags = new List<string>();

                    // 1. Locations
                    if (root.TryGetProperty("locations", out var locationsProp) && locationsProp.ValueKind == System.Text.Json.JsonValueKind.Array)
                    {
                        foreach (var loc in locationsProp.EnumerateArray())
                        {
                            var locStr = loc.GetString();
                            if (!string.IsNullOrEmpty(locStr))
                            {
                                tags.Add(locationMapping.TryGetValue(locStr.ToLowerInvariant(), out var mapped) ? mapped : locStr);
                            }
                        }
                    }

                    // 2. Colors
                    if (root.TryGetProperty("colors", out var colorsProp) && colorsProp.ValueKind == System.Text.Json.JsonValueKind.Array)
                    {
                        foreach (var col in colorsProp.EnumerateArray())
                        {
                            var colStr = col.GetString();
                            if (!string.IsNullOrEmpty(colStr))
                            {
                                tags.Add(colorMapping.TryGetValue(colStr.ToLowerInvariant(), out var mapped) ? mapped : colStr);
                            }
                        }
                    }

                    // 3. Fashion (Styles)
                    if (root.TryGetProperty("fashion", out var fashionProp) && fashionProp.ValueKind == System.Text.Json.JsonValueKind.Array)
                    {
                        foreach (var fash in fashionProp.EnumerateArray())
                        {
                            var fashStr = fash.GetString();
                            if (Guid.TryParse(fashStr, out var styleId))
                            {
                                if (styleMap.TryGetValue(styleId, out var name))
                                    tags.Add(name);
                            }
                            else if (!string.IsNullOrEmpty(fashStr))
                            {
                                tags.Add(fashStr);
                            }
                        }
                    }

                    // 4. Concepts
                    if (root.TryGetProperty("concepts", out var conceptsProp) && conceptsProp.ValueKind == System.Text.Json.JsonValueKind.Array)
                    {
                        foreach (var con in conceptsProp.EnumerateArray())
                        {
                            var conStr = con.GetString();
                            if (Guid.TryParse(conStr, out var conceptId))
                            {
                                if (conceptMap.TryGetValue(conceptId, out var name))
                                    tags.Add(name);
                            }
                            else if (!string.IsNullOrEmpty(conStr))
                            {
                                tags.Add(conStr);
                            }
                        }
                    }

                    var cleanTags = tags
                        .Where(t => !string.IsNullOrWhiteSpace(t))
                        .Select(t => t.Trim())
                        .Distinct()
                        .ToList();

                    var oldVal = customer.PreferredStyles;
                    customer.PreferredStyles = string.Join(", ", cleanTags);

                    logger.LogInformation("Migrated customer {DisplayName} ({Email}): {Old} -> {New}", 
                        customer.DisplayName, customer.Email, oldVal, customer.PreferredStyles);
                }
                catch (Exception parseEx)
                {
                    logger.LogWarning(parseEx, "Failed to parse preferred styles JSON for customer {Id}.", customer.Id);
                }
            }

            await db.SaveChangesAsync(cancellationToken);
            logger.LogInformation("Database PreferredStyles migration completed successfully.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to migrate database PreferredStyles.");
        }
    }
}
