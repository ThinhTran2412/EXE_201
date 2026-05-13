using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShootMatch.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPhotographerQuote : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Quote",
                table: "photographers",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Quote",
                table: "photographers");
        }
    }
}
