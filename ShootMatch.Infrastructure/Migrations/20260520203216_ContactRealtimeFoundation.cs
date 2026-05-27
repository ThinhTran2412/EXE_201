using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShootMatch.Infrastructure.Migrations;

/// <inheritdoc />
public partial class ContactRealtimeFoundation : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "call_sessions",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                ConversationId = table.Column<Guid>(type: "uuid", nullable: false),
                CallType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                InitiatorId = table.Column<Guid>(type: "uuid", nullable: false),
                InitiatorRole = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                AnsweredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                EndedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                EndReason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                SessionToken = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                LastSignalAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_call_sessions", x => x.Id);
                table.ForeignKey(
                    name: "FK_call_sessions_conversations_ConversationId",
                    column: x => x.ConversationId,
                    principalTable: "conversations",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_call_sessions_ConversationId_StartedAt",
            table: "call_sessions",
            columns: new[] { "ConversationId", "StartedAt" });

        migrationBuilder.CreateIndex(
            name: "IX_call_sessions_ConversationId_Status",
            table: "call_sessions",
            columns: new[] { "ConversationId", "Status" });
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "call_sessions");
    }
}
