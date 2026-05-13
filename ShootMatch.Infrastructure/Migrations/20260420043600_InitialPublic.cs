using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShootMatch.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialPublic : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "auth_sessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uuid", nullable: false),
                    RefreshToken = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsRevoked = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_auth_sessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "customers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Phone = table.Column<string>(type: "character varying(25)", maxLength: 25, nullable: false),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Region = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    AvatarUrl = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                    IsVerified = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_customers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "photographers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Region = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    MinBudget = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    MaxBudget = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Rating = table.Column<double>(type: "double precision", nullable: false),
                    IsPremium = table.Column<bool>(type: "boolean", nullable: false),
                    IsAvailable = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_photographers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "search_sessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uuid", nullable: false),
                    InputImageCount = table.Column<int>(type: "integer", nullable: false),
                    Region = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Budget = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_search_sessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "swipe_actions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uuid", nullable: false),
                    SearchSessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    PhotographerId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsLiked = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_swipe_actions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "portfolio_embeddings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PhotographerId = table.Column<Guid>(type: "uuid", nullable: false),
                    VectorJson = table.Column<string>(type: "jsonb", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_portfolio_embeddings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_portfolio_embeddings_photographers_PhotographerId",
                        column: x => x.PhotographerId,
                        principalTable: "photographers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_auth_sessions_CustomerId",
                table: "auth_sessions",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_auth_sessions_RefreshToken",
                table: "auth_sessions",
                column: "RefreshToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_portfolio_embeddings_PhotographerId",
                table: "portfolio_embeddings",
                column: "PhotographerId");

            migrationBuilder.CreateIndex(
                name: "IX_search_sessions_CustomerId",
                table: "search_sessions",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_swipe_actions_CustomerId_SearchSessionId",
                table: "swipe_actions",
                columns: new[] { "CustomerId", "SearchSessionId" });

            migrationBuilder.CreateIndex(
                name: "IX_swipe_actions_PhotographerId",
                table: "swipe_actions",
                column: "PhotographerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "auth_sessions");

            migrationBuilder.DropTable(
                name: "customers");

            migrationBuilder.DropTable(
                name: "portfolio_embeddings");

            migrationBuilder.DropTable(
                name: "search_sessions");

            migrationBuilder.DropTable(
                name: "swipe_actions");

            migrationBuilder.DropTable(
                name: "photographers");
        }
    }
}
