using ECommerceApi.DataAccess;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace ECommerceApi.Endpoints;

// Frontend'den gelecek durum güncelleme isteğini karşılayacak DTO
public record SiparisDurumGuncelleDTO(string YeniDurum);

public static class AdminEndpoints
{
    public static void MapAdminEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/admin");

        // --- DASHBOARD İSTATİSTİKLERİ ---
        group.MapGet("/dashboard", [Authorize(Roles = "Admin")] async (AppDbContext db) =>
        {
            var toplamUrun = await db.Urunler.CountAsync();
            var toplamKullanici = await db.Kullanicilar.CountAsync();
            var beklemedeOlanSiparisler = await db.Siparisler.CountAsync(s => s.Durum == "Hazırlanıyor");

            return Results.Ok(new
            {
                ToplamUrun = toplamUrun,
                ToplamKullanici = toplamKullanici,
                BekleyenSiparisler = beklemedeOlanSiparisler
            });
        });

        // --- 1. TÜM SİPARİŞLERİ LİSTELE (ADMİN) ---
        group.MapGet("/siparisler", [Authorize(Roles = "Admin")] async (AppDbContext db) =>
        {
            var tumSiparisler = await db.Siparisler
                .Include(s => s.Detaylar)
                    .ThenInclude(d => d.Urunler)
                .OrderByDescending(s => s.SiparisTarihi)
                .Select(s => new
                {
                    s.Id,
                    s.SiparisTarihi,
                    s.ToplamTutar,
                    s.Durum,
                    KullaniciId = s.KullaniciId, 
                    Urunler = s.Detaylar.Select(d => new
                    {
                        Ad = d.Urunler != null ? d.Urunler.Ad : "Silinmiş Ürün",
                        Adet = d.Adet,
                        BirimFiyat = d.BirimFiyat
                    })
                })
                .ToListAsync();

            return Results.Ok(tumSiparisler);
        });

        // --- 2. SİPARİŞ DURUMUNU GÜNCELLE ---
        group.MapPut("/siparisler/{id}/durum", [Authorize(Roles = "Admin")] async (int id, SiparisDurumGuncelleDTO dto, AppDbContext db) =>
        {
            var siparis = await db.Siparisler.FindAsync(id);
            if (siparis == null) return Results.NotFound(new { Mesaj = "Sipariş bulunamadı." });

            siparis.Durum = dto.YeniDurum;
            await db.SaveChangesAsync();

            return Results.Ok(new { Mesaj = "Sipariş durumu başarıyla güncellendi.", YeniDurum = siparis.Durum });
        });
    }
}