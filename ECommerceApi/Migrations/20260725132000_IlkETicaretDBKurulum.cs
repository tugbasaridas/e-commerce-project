using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ECommerceApi.Migrations
{
    /// <inheritdoc />
    public partial class IlkETicaretDBKurulum : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Kategoriler",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Ad = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Kategoriler", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Kullanicilar",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Email = table.Column<string>(type: "text", nullable: false),
                    SifreHash = table.Column<string>(type: "text", nullable: false),
                    AdSoyad = table.Column<string>(type: "text", nullable: true),
                    Rol = table.Column<string>(type: "text", nullable: false),
                    OlusturulmaTarihi = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RefreshToken = table.Column<string>(type: "text", nullable: true),
                    RefreshTokenExpiryTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Kullanicilar", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Siparisler",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    KullaniciId = table.Column<int>(type: "integer", nullable: false),
                    SiparisTarihi = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ToplamTutar = table.Column<decimal>(type: "numeric", nullable: false),
                    Durum = table.Column<string>(type: "text", nullable: false),
                    OdemeYontemi = table.Column<string>(type: "text", nullable: false),
                    TeslimatAdresi = table.Column<string>(type: "text", nullable: false),
                    Telefon = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Siparisler", x => x.Id);
                });

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

            migrationBuilder.CreateTable(
                name: "Magazalar",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    KullaniciId = table.Column<int>(type: "integer", nullable: false),
                    MagazaAdi = table.Column<string>(type: "text", nullable: false),
                    VergiNo = table.Column<string>(type: "text", nullable: true),
                    IletisimTelefonu = table.Column<string>(type: "text", nullable: true),
                    OrtalamaPuan = table.Column<double>(type: "double precision", nullable: false),
                    OnaylandiMi = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Magazalar", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Magazalar_Kullanicilar_KullaniciId",
                        column: x => x.KullaniciId,
                        principalTable: "Kullanicilar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Urunler",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Ad = table.Column<string>(type: "text", nullable: false),
                    Aciklama = table.Column<string>(type: "text", nullable: true),
                    Fiyat = table.Column<decimal>(type: "numeric", nullable: false),
                    IndirimliFiyat = table.Column<decimal>(type: "numeric", nullable: true),
                    IndirimBitisTarihi = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Stok = table.Column<int>(type: "integer", nullable: false),
                    ResimUrl = table.Column<string>(type: "text", nullable: true),
                    OlusturulmaTarihi = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    KategoriId = table.Column<int>(type: "integer", nullable: false),
                    MagazaId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Urunler", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Urunler_Kategoriler_KategoriId",
                        column: x => x.KategoriId,
                        principalTable: "Kategoriler",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Urunler_Magazalar_MagazaId",
                        column: x => x.MagazaId,
                        principalTable: "Magazalar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Favoriler",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    KullaniciId = table.Column<int>(type: "integer", nullable: false),
                    UrunId = table.Column<int>(type: "integer", nullable: false),
                    OlusturulmaTarihi = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Favoriler", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Favoriler_Kullanicilar_KullaniciId",
                        column: x => x.KullaniciId,
                        principalTable: "Kullanicilar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Favoriler_Urunler_UrunId",
                        column: x => x.UrunId,
                        principalTable: "Urunler",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Oylamalar",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Puan = table.Column<int>(type: "integer", nullable: false),
                    UrunId = table.Column<int>(type: "integer", nullable: false),
                    KullaniciId = table.Column<int>(type: "integer", nullable: false),
                    YorumMetni = table.Column<string>(type: "text", nullable: true),
                    Tarih = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Oylamalar", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Oylamalar_Kullanicilar_KullaniciId",
                        column: x => x.KullaniciId,
                        principalTable: "Kullanicilar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Oylamalar_Urunler_UrunId",
                        column: x => x.UrunId,
                        principalTable: "Urunler",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SepetUrunleri",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    KullaniciId = table.Column<int>(type: "integer", nullable: false),
                    UrunId = table.Column<int>(type: "integer", nullable: false),
                    Miktar = table.Column<int>(type: "integer", nullable: false),
                    OlusturulmaTarihi = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SepetUrunleri", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SepetUrunleri_Kullanicilar_KullaniciId",
                        column: x => x.KullaniciId,
                        principalTable: "Kullanicilar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SepetUrunleri_Urunler_UrunId",
                        column: x => x.UrunId,
                        principalTable: "Urunler",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SiparisDetaylari",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SiparisId = table.Column<int>(type: "integer", nullable: false),
                    UrunId = table.Column<int>(type: "integer", nullable: false),
                    Adet = table.Column<int>(type: "integer", nullable: false),
                    BirimFiyat = table.Column<decimal>(type: "numeric", nullable: false),
                    Durum = table.Column<string>(type: "text", nullable: false),
                    KargoFirma = table.Column<string>(type: "text", nullable: true),
                    KargoTakipNo = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiparisDetaylari", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SiparisDetaylari_Siparisler_SiparisId",
                        column: x => x.SiparisId,
                        principalTable: "Siparisler",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SiparisDetaylari_Urunler_UrunId",
                        column: x => x.UrunId,
                        principalTable: "Urunler",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DestekTalepleri_KullaniciId",
                table: "DestekTalepleri",
                column: "KullaniciId");

            migrationBuilder.CreateIndex(
                name: "IX_Favoriler_KullaniciId",
                table: "Favoriler",
                column: "KullaniciId");

            migrationBuilder.CreateIndex(
                name: "IX_Favoriler_UrunId",
                table: "Favoriler",
                column: "UrunId");

            migrationBuilder.CreateIndex(
                name: "IX_Magazalar_KullaniciId",
                table: "Magazalar",
                column: "KullaniciId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Oylamalar_KullaniciId",
                table: "Oylamalar",
                column: "KullaniciId");

            migrationBuilder.CreateIndex(
                name: "IX_Oylamalar_UrunId",
                table: "Oylamalar",
                column: "UrunId");

            migrationBuilder.CreateIndex(
                name: "IX_SepetUrunleri_KullaniciId",
                table: "SepetUrunleri",
                column: "KullaniciId");

            migrationBuilder.CreateIndex(
                name: "IX_SepetUrunleri_UrunId",
                table: "SepetUrunleri",
                column: "UrunId");

            migrationBuilder.CreateIndex(
                name: "IX_SiparisDetaylari_SiparisId",
                table: "SiparisDetaylari",
                column: "SiparisId");

            migrationBuilder.CreateIndex(
                name: "IX_SiparisDetaylari_UrunId",
                table: "SiparisDetaylari",
                column: "UrunId");

            migrationBuilder.CreateIndex(
                name: "IX_Urunler_KategoriId",
                table: "Urunler",
                column: "KategoriId");

            migrationBuilder.CreateIndex(
                name: "IX_Urunler_MagazaId",
                table: "Urunler",
                column: "MagazaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DestekTalepleri");

            migrationBuilder.DropTable(
                name: "Favoriler");

            migrationBuilder.DropTable(
                name: "Oylamalar");

            migrationBuilder.DropTable(
                name: "SepetUrunleri");

            migrationBuilder.DropTable(
                name: "SiparisDetaylari");

            migrationBuilder.DropTable(
                name: "Siparisler");

            migrationBuilder.DropTable(
                name: "Urunler");

            migrationBuilder.DropTable(
                name: "Kategoriler");

            migrationBuilder.DropTable(
                name: "Magazalar");

            migrationBuilder.DropTable(
                name: "Kullanicilar");
        }
    }
}
