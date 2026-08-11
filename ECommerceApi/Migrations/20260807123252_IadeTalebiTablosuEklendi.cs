using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ECommerceApi.Migrations
{
    /// <inheritdoc />
    public partial class IadeTalebiTablosuEklendi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "IadeTalepleri",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    KullaniciId = table.Column<int>(type: "integer", nullable: false),
                    SiparisDetayId = table.Column<int>(type: "integer", nullable: false),
                    MagazaId = table.Column<int>(type: "integer", nullable: false),
                    IadeSebebi = table.Column<string>(type: "text", nullable: false),
                    Durum = table.Column<string>(type: "text", nullable: false),
                    RedSebebi = table.Column<string>(type: "text", nullable: true),
                    OlusturulmaTarihi = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IadeTalepleri", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IadeTalepleri_Kullanicilar_KullaniciId",
                        column: x => x.KullaniciId,
                        principalTable: "Kullanicilar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_IadeTalepleri_Magazalar_MagazaId",
                        column: x => x.MagazaId,
                        principalTable: "Magazalar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_IadeTalepleri_SiparisDetaylari_SiparisDetayId",
                        column: x => x.SiparisDetayId,
                        principalTable: "SiparisDetaylari",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_IadeTalepleri_KullaniciId",
                table: "IadeTalepleri",
                column: "KullaniciId");

            migrationBuilder.CreateIndex(
                name: "IX_IadeTalepleri_MagazaId",
                table: "IadeTalepleri",
                column: "MagazaId");

            migrationBuilder.CreateIndex(
                name: "IX_IadeTalepleri_SiparisDetayId",
                table: "IadeTalepleri",
                column: "SiparisDetayId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IadeTalepleri");
        }
    }
}
