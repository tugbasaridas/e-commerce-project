using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ECommerceApi.Migrations
{
    /// <inheritdoc />
    public partial class AddKuponVeTakipSistemi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Kuponlar",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Kodu = table.Column<string>(type: "text", nullable: false),
                    OlusturanRol = table.Column<string>(type: "text", nullable: false),
                    MagazaId = table.Column<int>(type: "integer", nullable: true),
                    IndirimTipi = table.Column<string>(type: "text", nullable: false),
                    IndirimDegeri = table.Column<decimal>(type: "numeric", nullable: false),
                    AltLimit = table.Column<decimal>(type: "numeric", nullable: false),
                    BitisTarihi = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AktifMi = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Kuponlar", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Kuponlar_Magazalar_MagazaId",
                        column: x => x.MagazaId,
                        principalTable: "Magazalar",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Takipciler",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    KullaniciId = table.Column<int>(type: "integer", nullable: false),
                    MagazaId = table.Column<int>(type: "integer", nullable: false),
                    TakipTarihi = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Takipciler", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Takipciler_Kullanicilar_KullaniciId",
                        column: x => x.KullaniciId,
                        principalTable: "Kullanicilar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Takipciler_Magazalar_MagazaId",
                        column: x => x.MagazaId,
                        principalTable: "Magazalar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KullaniciKuponlari",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    KullaniciId = table.Column<int>(type: "integer", nullable: false),
                    KuponId = table.Column<int>(type: "integer", nullable: false),
                    KullanildiMi = table.Column<bool>(type: "boolean", nullable: false),
                    TanimlanmaTarihi = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KullaniciKuponlari", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KullaniciKuponlari_Kullanicilar_KullaniciId",
                        column: x => x.KullaniciId,
                        principalTable: "Kullanicilar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KullaniciKuponlari_Kuponlar_KuponId",
                        column: x => x.KuponId,
                        principalTable: "Kuponlar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_KullaniciKuponlari_KullaniciId_KuponId",
                table: "KullaniciKuponlari",
                columns: new[] { "KullaniciId", "KuponId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_KullaniciKuponlari_KuponId",
                table: "KullaniciKuponlari",
                column: "KuponId");

            migrationBuilder.CreateIndex(
                name: "IX_Kuponlar_MagazaId",
                table: "Kuponlar",
                column: "MagazaId");

            migrationBuilder.CreateIndex(
                name: "IX_Takipciler_KullaniciId_MagazaId",
                table: "Takipciler",
                columns: new[] { "KullaniciId", "MagazaId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Takipciler_MagazaId",
                table: "Takipciler",
                column: "MagazaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "KullaniciKuponlari");

            migrationBuilder.DropTable(
                name: "Takipciler");

            migrationBuilder.DropTable(
                name: "Kuponlar");
        }
    }
}
