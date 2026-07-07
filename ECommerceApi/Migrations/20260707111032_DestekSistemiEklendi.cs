using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ECommerceApi.Migrations
{
    /// <inheritdoc />
    public partial class DestekSistemiEklendi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DestekTalepleri",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    KullaniciId = table.Column<int>(type: "integer", nullable: false),
                    Konu = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Mesaj = table.Column<string>(type: "text", nullable: false),
                    AdminCevabi = table.Column<string>(type: "text", nullable: true),
                    Durum = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    OlusturulmaTarihi = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CevaplanmaTarihi = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DestekTalepleri", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DestekTalepleri_Kullanicilar_KullaniciId",
                        column: x => x.KullaniciId,
                        principalTable: "Kullanicilar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SiparisDetaylari_UrunId",
                table: "SiparisDetaylari",
                column: "UrunId");

            migrationBuilder.CreateIndex(
                name: "IX_DestekTalepleri_KullaniciId",
                table: "DestekTalepleri",
                column: "KullaniciId");

            migrationBuilder.AddForeignKey(
                name: "FK_SiparisDetaylari_Urunler_UrunId",
                table: "SiparisDetaylari",
                column: "UrunId",
                principalTable: "Urunler",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SiparisDetaylari_Urunler_UrunId",
                table: "SiparisDetaylari");

            migrationBuilder.DropTable(
                name: "DestekTalepleri");

            migrationBuilder.DropIndex(
                name: "IX_SiparisDetaylari_UrunId",
                table: "SiparisDetaylari");
        }
    }
}
