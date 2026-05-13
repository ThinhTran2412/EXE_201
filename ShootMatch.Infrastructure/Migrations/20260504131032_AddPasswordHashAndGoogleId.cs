using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShootMatch.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPasswordHashAndGoogleId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GoogleId",
                table: "photographers",
                type: "character varying(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PasswordHash",
                table: "photographers",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GoogleId",
                table: "customers",
                type: "character varying(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PasswordHash",
                table: "customers",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_photographers_Email",
                table: "photographers",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_photographers_GoogleId",
                table: "photographers",
                column: "GoogleId");

            migrationBuilder.CreateIndex(
                name: "IX_customers_Email",
                table: "customers",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_customers_GoogleId",
                table: "customers",
                column: "GoogleId");

            migrationBuilder.CreateIndex(
                name: "IX_customers_Phone",
                table: "customers",
                column: "Phone");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_photographers_Email",
                table: "photographers");

            migrationBuilder.DropIndex(
                name: "IX_photographers_GoogleId",
                table: "photographers");

            migrationBuilder.DropIndex(
                name: "IX_customers_Email",
                table: "customers");

            migrationBuilder.DropIndex(
                name: "IX_customers_GoogleId",
                table: "customers");

            migrationBuilder.DropIndex(
                name: "IX_customers_Phone",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "GoogleId",
                table: "photographers");

            migrationBuilder.DropColumn(
                name: "PasswordHash",
                table: "photographers");

            migrationBuilder.DropColumn(
                name: "GoogleId",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "PasswordHash",
                table: "customers");
        }
    }
}
