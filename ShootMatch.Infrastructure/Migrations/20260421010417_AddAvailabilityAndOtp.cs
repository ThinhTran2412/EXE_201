using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShootMatch.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAvailabilityAndOtp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "otp_records",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Phone = table.Column<string>(type: "character varying(25)", maxLength: 25, nullable: false),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    AttemptCount = table.Column<int>(type: "integer", nullable: false),
                    IsUsed = table.Column<bool>(type: "boolean", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_otp_records", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "photographer_availabilities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PhotographerId = table.Column<Guid>(type: "uuid", nullable: false),
                    DayOfWeek = table.Column<int>(type: "integer", nullable: true),
                    SpecificDate = table.Column<DateOnly>(type: "date", nullable: true),
                    StartTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    EndTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    SlotType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_photographer_availabilities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_photographer_availabilities_photographers_PhotographerId",
                        column: x => x.PhotographerId,
                        principalTable: "photographers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_otp_records_ExpiresAt",
                table: "otp_records",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_otp_records_Phone_IsUsed",
                table: "otp_records",
                columns: new[] { "Phone", "IsUsed" });

            migrationBuilder.CreateIndex(
                name: "IX_photographer_availabilities_PhotographerId_DayOfWeek",
                table: "photographer_availabilities",
                columns: new[] { "PhotographerId", "DayOfWeek" });

            migrationBuilder.CreateIndex(
                name: "IX_photographer_availabilities_PhotographerId_SpecificDate",
                table: "photographer_availabilities",
                columns: new[] { "PhotographerId", "SpecificDate" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "otp_records");

            migrationBuilder.DropTable(
                name: "photographer_availabilities");
        }
    }
}
