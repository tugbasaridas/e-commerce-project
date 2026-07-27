using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ECommerceApi.Migrations
{
    /// <inheritdoc />
    public partial class InitialMarketplace : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "MagazaId",
                table: "Urunler",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "AdminOnayliMi",
                table: "Urunler",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AktifMi",
                table: "Urunler",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "PlatformKomisyonu",
                table: "SiparisDetaylari",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "SaticiKazanci",
                table: "SiparisDetaylari",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateIndex(
                name: "IX_Siparisler_KullaniciId",
                table: "Siparisler",
                column: "KullaniciId");

            migrationBuilder.AddForeignKey(
                name: "FK_Siparisler_Kullanicilar_KullaniciId",
                table: "Siparisler",
                column: "KullaniciId",
                principalTable: "Kullanicilar",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Siparisler_Kullanicilar_KullaniciId",
                table: "Siparisler");

            migrationBuilder.DropIndex(
                name: "IX_Siparisler_KullaniciId",
                table: "Siparisler");

            migrationBuilder.DropColumn(
                name: "AdminOnayliMi",
                table: "Urunler");

            migrationBuilder.DropColumn(
                name: "AktifMi",
                table: "Urunler");

            migrationBuilder.DropColumn(
                name: "PlatformKomisyonu",
                table: "SiparisDetaylari");

            migrationBuilder.DropColumn(
                name: "SaticiKazanci",
                table: "SiparisDetaylari");

            migrationBuilder.AlterColumn<int>(
                name: "MagazaId",
                table: "Urunler",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");
        }
    }
}
