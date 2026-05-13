using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShootMatch.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SchemaExpansionV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsLiked",
                table: "swipe_actions");

            migrationBuilder.AddColumn<string>(
                name: "Direction",
                table: "swipe_actions",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "ExpiresAt",
                table: "search_sessions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferenceImageUrlsJson",
                table: "search_sessions",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "search_sessions",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "StyleVectorJson",
                table: "search_sessions",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "AcceptsInstantBooking",
                table: "photographers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "AvatarUrl",
                table: "photographers",
                type: "character varying(1024)",
                maxLength: 1024,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Bio",
                table: "photographers",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CoverPhotoUrl",
                table: "photographers",
                type: "character varying(1024)",
                maxLength: 1024,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "photographers",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "photographers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "photographers",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "InstagramUrl",
                table: "photographers",
                type: "character varying(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                table: "photographers",
                type: "character varying(25)",
                maxLength: 25,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "photographers",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "VerificationStatus",
                table: "photographers",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "customers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "customers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastSeenAt",
                table: "customers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PreferredBudgetMax",
                table: "customers",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PreferredBudgetMin",
                table: "customers",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IpAddress",
                table: "auth_sessions",
                type: "character varying(45)",
                maxLength: 45,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RevokedAt",
                table: "auth_sessions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UserAgent",
                table: "auth_sessions",
                type: "character varying(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "bookings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uuid", nullable: false),
                    PhotographerId = table.Column<Guid>(type: "uuid", nullable: false),
                    MatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    ServicePackageId = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    AgreedPrice = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Commission = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    EscrowStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ScheduledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CancellationReason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bookings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "matches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uuid", nullable: false),
                    PhotographerId = table.Column<Guid>(type: "uuid", nullable: false),
                    SearchSessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    MatchedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ClosedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_matches", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "portfolio_photos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PhotographerId = table.Column<Guid>(type: "uuid", nullable: false),
                    ImageUrl = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                    ThumbnailUrl = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsIndexed = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_portfolio_photos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_portfolio_photos_photographers_PhotographerId",
                        column: x => x.PhotographerId,
                        principalTable: "photographers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "reviews",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingId = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorCustomerId = table.Column<Guid>(type: "uuid", nullable: false),
                    TargetPhotographerId = table.Column<Guid>(type: "uuid", nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: false),
                    Comment = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reviews", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "service_packages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PhotographerId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Price = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    DurationHours = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_service_packages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_service_packages_photographers_PhotographerId",
                        column: x => x.PhotographerId,
                        principalTable: "photographers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "verification_requests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PhotographerId = table.Column<Guid>(type: "uuid", nullable: false),
                    DocumentType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DocumentImageUrl = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                    SelfieUrl = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ReviewedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ReviewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_verification_requests", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_bookings_CustomerId",
                table: "bookings",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_bookings_MatchId",
                table: "bookings",
                column: "MatchId");

            migrationBuilder.CreateIndex(
                name: "IX_bookings_PhotographerId",
                table: "bookings",
                column: "PhotographerId");

            migrationBuilder.CreateIndex(
                name: "IX_matches_CustomerId_PhotographerId",
                table: "matches",
                columns: new[] { "CustomerId", "PhotographerId" });

            migrationBuilder.CreateIndex(
                name: "IX_matches_SearchSessionId",
                table: "matches",
                column: "SearchSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_portfolio_photos_PhotographerId",
                table: "portfolio_photos",
                column: "PhotographerId");

            migrationBuilder.CreateIndex(
                name: "IX_reviews_BookingId",
                table: "reviews",
                column: "BookingId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_reviews_TargetPhotographerId",
                table: "reviews",
                column: "TargetPhotographerId");

            migrationBuilder.CreateIndex(
                name: "IX_service_packages_PhotographerId",
                table: "service_packages",
                column: "PhotographerId");

            migrationBuilder.CreateIndex(
                name: "IX_verification_requests_PhotographerId",
                table: "verification_requests",
                column: "PhotographerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "bookings");

            migrationBuilder.DropTable(
                name: "matches");

            migrationBuilder.DropTable(
                name: "portfolio_photos");

            migrationBuilder.DropTable(
                name: "reviews");

            migrationBuilder.DropTable(
                name: "service_packages");

            migrationBuilder.DropTable(
                name: "verification_requests");

            migrationBuilder.DropColumn(
                name: "Direction",
                table: "swipe_actions");

            migrationBuilder.DropColumn(
                name: "ExpiresAt",
                table: "search_sessions");

            migrationBuilder.DropColumn(
                name: "ReferenceImageUrlsJson",
                table: "search_sessions");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "search_sessions");

            migrationBuilder.DropColumn(
                name: "StyleVectorJson",
                table: "search_sessions");

            migrationBuilder.DropColumn(
                name: "AcceptsInstantBooking",
                table: "photographers");

            migrationBuilder.DropColumn(
                name: "AvatarUrl",
                table: "photographers");

            migrationBuilder.DropColumn(
                name: "Bio",
                table: "photographers");

            migrationBuilder.DropColumn(
                name: "CoverPhotoUrl",
                table: "photographers");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "photographers");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "photographers");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "photographers");

            migrationBuilder.DropColumn(
                name: "InstagramUrl",
                table: "photographers");

            migrationBuilder.DropColumn(
                name: "Phone",
                table: "photographers");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "photographers");

            migrationBuilder.DropColumn(
                name: "VerificationStatus",
                table: "photographers");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "LastSeenAt",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "PreferredBudgetMax",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "PreferredBudgetMin",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "IpAddress",
                table: "auth_sessions");

            migrationBuilder.DropColumn(
                name: "RevokedAt",
                table: "auth_sessions");

            migrationBuilder.DropColumn(
                name: "UserAgent",
                table: "auth_sessions");

            migrationBuilder.AddColumn<bool>(
                name: "IsLiked",
                table: "swipe_actions",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}
