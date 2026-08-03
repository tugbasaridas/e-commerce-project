using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ECommerceApi.Migrations
{
    /// <inheritdoc />
    public partial class AddKuponToSiparis : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "IndirimTutari",
                table: "Siparisler",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "KuponId",
                table: "Siparisler",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Siparisler_KuponId",
                table: "Siparisler",
                column: "KuponId");

            migrationBuilder.AddForeignKey(
                name: "FK_Siparisler_Kuponlar_KuponId",
                table: "Siparisler",
                column: "KuponId",
                principalTable: "Kuponlar",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Siparisler_Kuponlar_KuponId",
                table: "Siparisler");

            migrationBuilder.DropIndex(
                name: "IX_Siparisler_KuponId",
                table: "Siparisler");

            migrationBuilder.DropColumn(
                name: "IndirimTutari",
                table: "Siparisler");

            migrationBuilder.DropColumn(
                name: "KuponId",
                table: "Siparisler");
        }
    }
}
