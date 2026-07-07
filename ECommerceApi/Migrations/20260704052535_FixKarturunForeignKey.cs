using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ECommerceApi.Migrations
{
    /// <inheritdoc />
    public partial class FixKarturunForeignKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SepetUrunleri_Kullanicilar_KullanicilarId",
                table: "SepetUrunleri");

            migrationBuilder.DropForeignKey(
                name: "FK_SepetUrunleri_Urunler_UrunlerId",
                table: "SepetUrunleri");

            migrationBuilder.DropIndex(
                name: "IX_SepetUrunleri_KullanicilarId",
                table: "SepetUrunleri");

            migrationBuilder.DropIndex(
                name: "IX_SepetUrunleri_UrunlerId",
                table: "SepetUrunleri");

            migrationBuilder.DropColumn(
                name: "KullanicilarId",
                table: "SepetUrunleri");

            migrationBuilder.DropColumn(
                name: "UrunlerId",
                table: "SepetUrunleri");

            migrationBuilder.CreateIndex(
                name: "IX_SepetUrunleri_KullaniciId",
                table: "SepetUrunleri",
                column: "KullaniciId");

            migrationBuilder.CreateIndex(
                name: "IX_SepetUrunleri_UrunId",
                table: "SepetUrunleri",
                column: "UrunId");

            migrationBuilder.AddForeignKey(
                name: "FK_SepetUrunleri_Kullanicilar_KullaniciId",
                table: "SepetUrunleri",
                column: "KullaniciId",
                principalTable: "Kullanicilar",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SepetUrunleri_Urunler_UrunId",
                table: "SepetUrunleri",
                column: "UrunId",
                principalTable: "Urunler",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SepetUrunleri_Kullanicilar_KullaniciId",
                table: "SepetUrunleri");

            migrationBuilder.DropForeignKey(
                name: "FK_SepetUrunleri_Urunler_UrunId",
                table: "SepetUrunleri");

            migrationBuilder.DropIndex(
                name: "IX_SepetUrunleri_KullaniciId",
                table: "SepetUrunleri");

            migrationBuilder.DropIndex(
                name: "IX_SepetUrunleri_UrunId",
                table: "SepetUrunleri");

            migrationBuilder.AddColumn<int>(
                name: "KullanicilarId",
                table: "SepetUrunleri",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "UrunlerId",
                table: "SepetUrunleri",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_SepetUrunleri_KullanicilarId",
                table: "SepetUrunleri",
                column: "KullanicilarId");

            migrationBuilder.CreateIndex(
                name: "IX_SepetUrunleri_UrunlerId",
                table: "SepetUrunleri",
                column: "UrunlerId");

            migrationBuilder.AddForeignKey(
                name: "FK_SepetUrunleri_Kullanicilar_KullanicilarId",
                table: "SepetUrunleri",
                column: "KullanicilarId",
                principalTable: "Kullanicilar",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SepetUrunleri_Urunler_UrunlerId",
                table: "SepetUrunleri",
                column: "UrunlerId",
                principalTable: "Urunler",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
