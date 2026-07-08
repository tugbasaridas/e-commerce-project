using ECommerceApi.DataAccess;
using ECommerceApi.Entities;
using Microsoft.EntityFrameworkCore;
using ECommerceApi.DTOs;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace ECommerceApi.Endpoints;

public static class UrunEndpoints
{
    public static void MapUrunEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/urunler");

        // 1. Ürünleri Listele (Ortalama Puan ve Oylama Sayısı ile)
        group.MapGet("/", async (AppDbContext db) =>
        {
            var urunler = await db.Urunler
                .Include(u => u.Kategori)
                .Select(u => new {
                    u.Id,
                    u.Ad,
                    u.Aciklama,
                    u.Fiyat,
                    u.ResimUrl,
                    KategoriId = u.KategoriId,
                    Kategori = u.Kategori != null ? new { u.Kategori.Id, u.Kategori.Ad } : null,
                    // Her ürünün oylarının ortalamasını burada hesaplıyoruz
                    OrtalamaPuan = u.Oylamalar.Any() ? Math.Round(u.Oylamalar.Average(o => o.Puan), 1) : 0.0,
                    OylamaSayisi = u.Oylamalar.Count()
                })
                .ToListAsync();

            return Results.Ok(urunler);
        });

        // 2. Tek Bir Ürün Getir (Detay Sayfası İçin)
        group.MapGet("/{id}", async (int id, AppDbContext db) =>
        {
            var urun = await db.Urunler
                .Include(u => u.Kategori)
                .Select(u => new {
                    u.Id,
                    u.Ad,
                    u.Aciklama,
                    u.Fiyat,
                    u.ResimUrl,
                    u.Kategori,
                    OrtalamaPuan = u.Oylamalar.Any() ? Math.Round(u.Oylamalar.Average(o => o.Puan), 1) : 0.0,
                    OylamaSayisi = u.Oylamalar.Count()
                })
                .FirstOrDefaultAsync(u => u.Id == id);
            
            if (urun is null) return Results.NotFound("Ürün bulunamadı.");
            return Results.Ok(urun);
        });

        // 3. Yeni Ürün Ekle
        group.MapPost("/", async (Urunler yeniUrun, AppDbContext db) =>
        {
            db.Urunler.Add(yeniUrun);
            await db.SaveChangesAsync();
            return Results.Created($"/api/urunler/{yeniUrun.Id}", yeniUrun);
        });

        // 4. Ürün Sil
        group.MapDelete("/{id}", async (int id, AppDbContext db) =>
        {
            var urun = await db.Urunler.FindAsync(id);
            if (urun is null) return Results.NotFound();
            db.Urunler.Remove(urun);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        // 5. Ürün Güncelle
        group.MapPut("/{id}", async (int id, UrunGuncelleDto guncelUrun, AppDbContext db) =>
        {
            var mevcutUrun = await db.Urunler.FindAsync(id);
            if (mevcutUrun is null) return Results.NotFound("Güncellenecek ürün bulunamadı.");

            if (guncelUrun.Ad != null) mevcutUrun.Ad = guncelUrun.Ad;
            if (guncelUrun.Aciklama != null) mevcutUrun.Aciklama = guncelUrun.Aciklama;
            if (guncelUrun.Fiyat.HasValue) mevcutUrun.Fiyat = guncelUrun.Fiyat.Value;
            if (guncelUrun.Stok.HasValue) mevcutUrun.Stok = guncelUrun.Stok.Value;
            if (guncelUrun.ResimUrl != null) mevcutUrun.ResimUrl = guncelUrun.ResimUrl;
            if (guncelUrun.KategoriId.HasValue) mevcutUrun.KategoriId = guncelUrun.KategoriId.Value;

            await db.SaveChangesAsync();
            return Results.Ok(mevcutUrun);
        });

        // 6. Ürüne Puan Ver (SADECE SATIN ALANLAR)
        group.MapPost("/{urunId}/oyla", [Authorize] async (int urunId, int puan, HttpContext context, AppDbContext db) =>
        {
            var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Results.Unauthorized();
            int userId = int.Parse(userIdClaim);

            if (puan < 1 || puan > 5)
                return Results.BadRequest(new { mesaj = "Puan 1 ile 5 arasında olmalıdır." });

            bool satinAlmisMi = await db.SiparisDetaylari
                .Include(s => s.Siparis)
                .AnyAsync(s => s.UrunId == urunId && s.Siparis != null && s.Siparis.KullaniciId == userId);

            if (!satinAlmisMi)
                return Results.BadRequest(new { mesaj = "Bu ürünü değerlendirebilmek için önce satın almanız gerekmektedir." });

            var mevcutOy = await db.Oylamalar.FirstOrDefaultAsync(o => o.UrunId == urunId && o.KullaniciId == userId);

            if (mevcutOy != null)
            {
                mevcutOy.Puan = puan;
                mevcutOy.Tarih = DateTime.UtcNow;
            }
            else
            {
                db.Oylamalar.Add(new Oylama { UrunId = urunId, KullaniciId = userId, Puan = puan, Tarih = DateTime.UtcNow });
            }

            await db.SaveChangesAsync();
            return Results.Ok(new { mesaj = "Teşekkürler, değerlendirmeniz kaydedildi." });
        });
    }
}