using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShootMatch.Infrastructure.Migrations
{
    public partial class AddPhotographerPersonalInfo : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NationalId",
                table: "photographers",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PersonalAddress",
                table: "photographers",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VerificationDocumentBackUrl",
                table: "photographers",
                type: "character varying(1024)",
                maxLength: 1024,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VerificationDocumentFrontUrl",
                table: "photographers",
                type: "character varying(1024)",
                maxLength: 1024,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VerificationPortraitUrl",
                table: "photographers",
                type: "character varying(1024)",
                maxLength: 1024,
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "NationalId", table: "photographers");
            migrationBuilder.DropColumn(name: "PersonalAddress", table: "photographers");
            migrationBuilder.DropColumn(name: "VerificationDocumentBackUrl", table: "photographers");
            migrationBuilder.DropColumn(name: "VerificationDocumentFrontUrl", table: "photographers");
            migrationBuilder.DropColumn(name: "VerificationPortraitUrl", table: "photographers");
        }
    }
}
