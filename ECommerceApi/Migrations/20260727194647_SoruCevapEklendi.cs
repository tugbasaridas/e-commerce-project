using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ECommerceApi.Migrations
{
    /// <inheritdoc />
    public partial class SoruCevapEklendi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UrunSorulari",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UrunId = table.Column<int>(type: "integer", nullable: false),
                    KullaniciId = table.Column<int>(type: "integer", nullable: false),
                    SoruMetni = table.Column<string>(type: "text", nullable: false),
                    SoruTarihi = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CevapMetni = table.Column<string>(type: "text", nullable: true),
                    CevapTarihi = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CevaplandiMi = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UrunSorulari", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UrunSorulari_Kullanicilar_KullaniciId",
                        column: x => x.KullaniciId,
                        principalTable: "Kullanicilar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UrunSorulari_Urunler_UrunId",
                        column: x => x.UrunId,
                        principalTable: "Urunler",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UrunSorulari_KullaniciId",
                table: "UrunSorulari",
                column: "KullaniciId");

            migrationBuilder.CreateIndex(
                name: "IX_UrunSorulari_UrunId",
                table: "UrunSorulari",
                column: "UrunId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UrunSorulari");
        }
    }
}
