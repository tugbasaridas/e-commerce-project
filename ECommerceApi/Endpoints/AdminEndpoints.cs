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
                // Siparişler tablosu ile Kullanıcılar tablosunu ID üzerinden birleştiriyoruz
                .Join(db.Kullanicilar,
                      s => s.KullaniciId,
                      k => k.Id,
                      (s, k) => new { Siparis = s, Kullanici = k })
                .OrderByDescending(x => x.Siparis.SiparisTarihi)
                .Select(x => new
                {
                    Id = x.Siparis.Id,
                    SiparisTarihi = x.Siparis.SiparisTarihi,
                    ToplamTutar = x.Siparis.ToplamTutar,
                    Durum = x.Siparis.Durum,
                    
                    OdemeYontemi = x.Siparis.OdemeYontemi,
                    TeslimatAdresi = x.Siparis.TeslimatAdresi,
                    
                    KullaniciId = x.Siparis.KullaniciId, 
                    KullaniciAdSoyad = x.Kullanici.AdSoyad,
                    KullaniciEmail = x.Kullanici.Email,
                    Urunler = x.Siparis.Detaylar.Select(d => new
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