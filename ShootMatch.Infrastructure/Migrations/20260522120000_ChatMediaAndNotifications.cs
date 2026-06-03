using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShootMatch.Infrastructure.Migrations;

public partial class ChatMediaAndNotifications : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "MediaPreviewUrl",
            table: "messages",
            type: "character varying(4000)",
            maxLength: 4000,
            nullable: true);

        migrationBuilder.AddColumn<DateTime>(
            name: "MediaExpiresAt",
            table: "messages",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AddColumn<bool>(
            name: "MediaDowngraded",
            table: "messages",
            type: "boolean",
            nullable: false,
            defaultValue: false);

        migrationBuilder.CreateTable(
            name: "app_notifications",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                RecipientId = table.Column<Guid>(type: "uuid", nullable: false),
                RecipientRole = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                Category = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                Body = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                PayloadJson = table.Column<string>(type: "jsonb", nullable: true),
                ActionType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                ReadAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_app_notifications", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_app_notifications_RecipientId_RecipientRole_CreatedAt",
            table: "app_notifications",
            columns: new[] { "RecipientId", "RecipientRole", "CreatedAt" });

        migrationBuilder.CreateIndex(
            name: "IX_app_notifications_RecipientId_RecipientRole_ReadAt",
            table: "app_notifications",
            columns: new[] { "RecipientId", "RecipientRole", "ReadAt" });

        migrationBuilder.CreateIndex(
            name: "IX_messages_ContentType_MediaExpiresAt_MediaDowngraded",
            table: "messages",
            columns: new[] { "ContentType", "MediaExpiresAt", "MediaDowngraded" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "app_notifications");
        migrationBuilder.DropIndex(name: "IX_messages_ContentType_MediaExpiresAt_MediaDowngraded", table: "messages");
        migrationBuilder.DropColumn(name: "MediaPreviewUrl", table: "messages");
        migrationBuilder.DropColumn(name: "MediaExpiresAt", table: "messages");
        migrationBuilder.DropColumn(name: "MediaDowngraded", table: "messages");
    }
}
