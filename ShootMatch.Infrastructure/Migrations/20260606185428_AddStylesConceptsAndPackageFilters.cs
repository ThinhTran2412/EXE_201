using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShootMatch.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStylesConceptsAndPackageFilters : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AgeGroup",
                table: "service_packages",
                type: "integer",
                nullable: false,
                defaultValue: 4);

            migrationBuilder.AddColumn<int>(
                name: "GroupSize",
                table: "service_packages",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "LocationType",
                table: "service_packages",
                type: "integer",
                nullable: false,
                defaultValue: 4);

            migrationBuilder.AddColumn<string>(
                name: "DominantColors",
                table: "portfolio_photos",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "concepts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Keywords = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    ApprovedById = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_concepts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "styles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Keywords = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    ApprovedById = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_styles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "customer_preferred_concepts",
                columns: table => new
                {
                    concept_id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_customer_preferred_concepts", x => new { x.concept_id, x.customer_id });
                    table.ForeignKey(
                        name: "FK_customer_preferred_concepts_concepts_concept_id",
                        column: x => x.concept_id,
                        principalTable: "concepts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_customer_preferred_concepts_customers_customer_id",
                        column: x => x.customer_id,
                        principalTable: "customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "photo_concepts",
                columns: table => new
                {
                    concept_id = table.Column<Guid>(type: "uuid", nullable: false),
                    portfolio_photo_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_photo_concepts", x => new { x.concept_id, x.portfolio_photo_id });
                    table.ForeignKey(
                        name: "FK_photo_concepts_concepts_concept_id",
                        column: x => x.concept_id,
                        principalTable: "concepts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_photo_concepts_portfolio_photos_portfolio_photo_id",
                        column: x => x.portfolio_photo_id,
                        principalTable: "portfolio_photos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "photographer_concepts",
                columns: table => new
                {
                    concept_id = table.Column<Guid>(type: "uuid", nullable: false),
                    photographer_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_photographer_concepts", x => new { x.concept_id, x.photographer_id });
                    table.ForeignKey(
                        name: "FK_photographer_concepts_concepts_concept_id",
                        column: x => x.concept_id,
                        principalTable: "concepts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_photographer_concepts_photographers_photographer_id",
                        column: x => x.photographer_id,
                        principalTable: "photographers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "concept_style_relations",
                columns: table => new
                {
                    ConceptId = table.Column<Guid>(type: "uuid", nullable: false),
                    StyleId = table.Column<Guid>(type: "uuid", nullable: false),
                    Weight = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_concept_style_relations", x => new { x.ConceptId, x.StyleId });
                    table.ForeignKey(
                        name: "FK_concept_style_relations_concepts_ConceptId",
                        column: x => x.ConceptId,
                        principalTable: "concepts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_concept_style_relations_styles_StyleId",
                        column: x => x.StyleId,
                        principalTable: "styles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "customer_preferred_styles",
                columns: table => new
                {
                    customer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    style_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_customer_preferred_styles", x => new { x.customer_id, x.style_id });
                    table.ForeignKey(
                        name: "FK_customer_preferred_styles_customers_customer_id",
                        column: x => x.customer_id,
                        principalTable: "customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_customer_preferred_styles_styles_style_id",
                        column: x => x.style_id,
                        principalTable: "styles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "photo_styles",
                columns: table => new
                {
                    portfolio_photo_id = table.Column<Guid>(type: "uuid", nullable: false),
                    style_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_photo_styles", x => new { x.portfolio_photo_id, x.style_id });
                    table.ForeignKey(
                        name: "FK_photo_styles_portfolio_photos_portfolio_photo_id",
                        column: x => x.portfolio_photo_id,
                        principalTable: "portfolio_photos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_photo_styles_styles_style_id",
                        column: x => x.style_id,
                        principalTable: "styles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "photographer_styles",
                columns: table => new
                {
                    photographer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    style_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_photographer_styles", x => new { x.photographer_id, x.style_id });
                    table.ForeignKey(
                        name: "FK_photographer_styles_photographers_photographer_id",
                        column: x => x.photographer_id,
                        principalTable: "photographers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_photographer_styles_styles_style_id",
                        column: x => x.style_id,
                        principalTable: "styles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_concept_style_relations_StyleId",
                table: "concept_style_relations",
                column: "StyleId");

            migrationBuilder.CreateIndex(
                name: "IX_concepts_Name",
                table: "concepts",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_customer_preferred_concepts_customer_id",
                table: "customer_preferred_concepts",
                column: "customer_id");

            migrationBuilder.CreateIndex(
                name: "IX_customer_preferred_styles_style_id",
                table: "customer_preferred_styles",
                column: "style_id");

            migrationBuilder.CreateIndex(
                name: "IX_photo_concepts_portfolio_photo_id",
                table: "photo_concepts",
                column: "portfolio_photo_id");

            migrationBuilder.CreateIndex(
                name: "IX_photo_styles_style_id",
                table: "photo_styles",
                column: "style_id");

            migrationBuilder.CreateIndex(
                name: "IX_photographer_concepts_photographer_id",
                table: "photographer_concepts",
                column: "photographer_id");

            migrationBuilder.CreateIndex(
                name: "IX_photographer_styles_style_id",
                table: "photographer_styles",
                column: "style_id");

            migrationBuilder.CreateIndex(
                name: "IX_styles_Name",
                table: "styles",
                column: "Name");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "concept_style_relations");

            migrationBuilder.DropTable(
                name: "customer_preferred_concepts");

            migrationBuilder.DropTable(
                name: "customer_preferred_styles");

            migrationBuilder.DropTable(
                name: "photo_concepts");

            migrationBuilder.DropTable(
                name: "photo_styles");

            migrationBuilder.DropTable(
                name: "photographer_concepts");

            migrationBuilder.DropTable(
                name: "photographer_styles");

            migrationBuilder.DropTable(
                name: "concepts");

            migrationBuilder.DropTable(
                name: "styles");

            migrationBuilder.DropColumn(
                name: "AgeGroup",
                table: "service_packages");

            migrationBuilder.DropColumn(
                name: "GroupSize",
                table: "service_packages");

            migrationBuilder.DropColumn(
                name: "LocationType",
                table: "service_packages");

            migrationBuilder.DropColumn(
                name: "DominantColors",
                table: "portfolio_photos");
        }
    }
}
