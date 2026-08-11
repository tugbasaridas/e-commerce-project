using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ECommerceApi.Migrations
{
    /// <inheritdoc />
    public partial class IadeTalebiKargoKodlariEklendi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "IadeKargoFirma",
                table: "IadeTalepleri",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IadeKargoKodu",
                table: "IadeTalepleri",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IadeKargoFirma",
                table: "IadeTalepleri");

            migrationBuilder.DropColumn(
                name: "IadeKargoKodu",
                table: "IadeTalepleri");
        }
    }
}
