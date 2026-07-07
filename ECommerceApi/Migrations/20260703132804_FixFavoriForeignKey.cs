using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ECommerceApi.Migrations
{
    /// <inheritdoc />
    public partial class FixFavoriForeignKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Favoriler_Kullanicilar_KullanicilarId",
                table: "Favoriler");

            migrationBuilder.DropForeignKey(
                name: "FK_Favoriler_Urunler_UrunlerId",
                table: "Favoriler");

            migrationBuilder.DropIndex(
                name: "IX_Favoriler_KullanicilarId",
                table: "Favoriler");

            migrationBuilder.DropIndex(
                name: "IX_Favoriler_UrunlerId",
                table: "Favoriler");

            migrationBuilder.DropColumn(
                name: "KullanicilarId",
                table: "Favoriler");

            migrationBuilder.DropColumn(
                name: "UrunlerId",
                table: "Favoriler");

            migrationBuilder.CreateIndex(
                name: "IX_Favoriler_KullaniciId",
                table: "Favoriler",
                column: "KullaniciId");

            migrationBuilder.CreateIndex(
                name: "IX_Favoriler_UrunId",
                table: "Favoriler",
                column: "UrunId");

            migrationBuilder.AddForeignKey(
                name: "FK_Favoriler_Kullanicilar_KullaniciId",
                table: "Favoriler",
                column: "KullaniciId",
                principalTable: "Kullanicilar",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Favoriler_Urunler_UrunId",
                table: "Favoriler",
                column: "UrunId",
                principalTable: "Urunler",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Favoriler_Kullanicilar_KullaniciId",
                table: "Favoriler");

            migrationBuilder.DropForeignKey(
                name: "FK_Favoriler_Urunler_UrunId",
                table: "Favoriler");

            migrationBuilder.DropIndex(
                name: "IX_Favoriler_KullaniciId",
                table: "Favoriler");

            migrationBuilder.DropIndex(
                name: "IX_Favoriler_UrunId",
                table: "Favoriler");

            migrationBuilder.AddColumn<int>(
                name: "KullanicilarId",
                table: "Favoriler",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "UrunlerId",
                table: "Favoriler",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Favoriler_KullanicilarId",
                table: "Favoriler",
                column: "KullanicilarId");

            migrationBuilder.CreateIndex(
                name: "IX_Favoriler_UrunlerId",
                table: "Favoriler",
                column: "UrunlerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Favoriler_Kullanicilar_KullanicilarId",
                table: "Favoriler",
                column: "KullanicilarId",
                principalTable: "Kullanicilar",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Favoriler_Urunler_UrunlerId",
                table: "Favoriler",
                column: "UrunlerId",
                principalTable: "Urunler",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
