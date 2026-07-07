using ECommerceApi.DataAccess;
using ECommerceApi.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ECommerceApi.Endpoints;

public static class SiparisEndpoints
{
    public static void MapSiparisEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/siparisler");

        // --- 1. SEPETTEN SİPARİŞ OLUŞTUR (SADECE GİRİŞ YAPAN KULLANICILAR) ---
        group.MapPost("/olustur", [Authorize] async (HttpContext context, AppDbContext db, ILogger<Program> logger) =>
        {
            // Token'dan ID çekme standardizasyonu
            var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Results.Unauthorized();
            int userId = int.Parse(userIdClaim);

            // Kullanıcının sepetindeki ürünleri çek (Kategori ilişkisi olmadan, sade)
            var sepetUrunleri = await db.SepetUrunleri
                .Include(k => k.Urunler)
                .Where(k => k.KullaniciId == userId)
                .ToListAsync();

            if (!sepetUrunleri.Any())
                return Results.BadRequest(new { Mesaj = "Sepetiniz boş, sipariş oluşturulamaz." });

            // Transaction Başlat
            using var transaction = await db.Database.BeginTransactionAsync();

            try
            {
                decimal toplamTutar = 0;
                var siparisDetaylari = new List<SiparisDetay>();

                foreach (var sepetItem in sepetUrunleri)
                {
                    var urun = sepetItem.Urunler;

                    if (urun == null || urun.Stok < sepetItem.Miktar)
                    {
                        
                        throw new Exception($"{urun?.Ad ?? "Bilinmeyen Ürün"} için yeterli stok bulunmuyor!");
                    }

                    // Tutar Hesaplama ve Stok Düşme
                    decimal satirTutari = urun.Fiyat * sepetItem.Miktar;
                    toplamTutar += satirTutari;
                    urun.Stok -= sepetItem.Miktar;

                    siparisDetaylari.Add(new SiparisDetay
                    {
                        UrunId = urun.Id,
                        Adet = sepetItem.Miktar,
                        BirimFiyat = urun.Fiyat 
                    });
                }

                var yeniSiparis = new Siparis
                {
                    KullaniciId = userId,
                    ToplamTutar = toplamTutar,
                    Durum = "Hazırlanıyor", 
                    SiparisTarihi = DateTime.UtcNow,
                    Detaylar = siparisDetaylari
                };

                db.Siparisler.Add(yeniSiparis);
                db.SepetUrunleri.RemoveRange(sepetUrunleri);

                await db.SaveChangesAsync();
                await transaction.CommitAsync();

                return Results.Ok(new { Mesaj = "Siparişiniz başarıyla oluşturuldu.", SiparisId = yeniSiparis.Id });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                
                logger.LogError(ex, "Sipariş oluşturulurken bir hata oluştu. Kullanıcı: {UserId}", userId);
                
                
                return Results.BadRequest(new { Mesaj = ex.Message });
            }
        });

        // --- 2. KULLANICININ KENDİ SİPARİŞ GEÇMİŞİNİ GETİR ---
        group.MapGet("/gecmisim", [Authorize] async (HttpContext context, AppDbContext db) =>
        {
            var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Results.Unauthorized();
            int userId = int.Parse(userIdClaim);

            var siparisler = await db.Siparisler
                .Where(s => s.KullaniciId == userId)
                .OrderByDescending(s => s.SiparisTarihi)
                .Select(s => new
                {
                    s.Id,
                    s.SiparisTarihi,
                    s.ToplamTutar,
                    s.Durum,
                    Urunler = s.Detaylar.Select(d => new
                    {
                        Ad = d.Urunler != null ? d.Urunler.Ad : "Ürün Silinmiş",
                        ResimUrl = d.Urunler != null ? d.Urunler.ResimUrl : "",
                        Adet = d.Adet,
                        SatinAlinanFiyat = d.BirimFiyat
                    })
                })
                .ToListAsync();

            return Results.Ok(siparisler);
        });
    }
}