using ECommerceApi.DataAccess;
using ECommerceApi.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ECommerceApi.Endpoints;

public record SepeteEkleDTO(int UrunId, int Miktar);

public record MiktarGuncelleDTO(int Miktar);

public static class KartEndpoints
{
    public static void MapKartEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/sepet").RequireAuthorization();

        // 1. SEPETİ GETİR
        group.MapGet("/", async (HttpContext context, AppDbContext db) =>
        {
            var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Results.Unauthorized();
            int userId = int.Parse(userIdClaim);

            var sepetListesi = await db.SepetUrunleri
                .Where(c => c.KullaniciId == userId)
                .Include(c => c.Urunler)
                .Select(c => new 
                {
                    Id = c.Id,
                    UrunId = c.UrunId,
                    Miktar = c.Miktar,
                    Urunler = c.Urunler != null ? new 
                    {
                        Ad = c.Urunler.Ad,
                        Fiyat = c.Urunler.Fiyat,
                        ResimUrl = c.Urunler.ResimUrl // Resim URL'yi de buraya ekledik ki ekranda görünsün
                    } : null
                })
                .ToListAsync();

            return Results.Ok(sepetListesi);
        });

        // 2. SEPETE ÜRÜN EKLE
        group.MapPost("/", async (SepeteEkleDTO dto, HttpContext context, AppDbContext db) =>
        {
            var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Results.Unauthorized();
            int userId = int.Parse(userIdClaim);
            
            var mevcutUrun = await db.SepetUrunleri
                .FirstOrDefaultAsync(c => c.KullaniciId == userId && c.UrunId == dto.UrunId);

            if (mevcutUrun != null)
            {
                mevcutUrun.Miktar += dto.Miktar;
            }
            else
            {
                db.SepetUrunleri.Add(new Karturun 
                { 
                    KullaniciId = userId, 
                    UrunId = dto.UrunId, 
                    Miktar = dto.Miktar 
                });
            }
            
            await db.SaveChangesAsync();
            return Results.Ok(new { Mesaj = "Sepet güncellendi." });
        });

        // 3. SEPETTEN ÜRÜN SİL
        group.MapDelete("/{id}", async (int id, HttpContext context, AppDbContext db) =>
        {
            var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Results.Unauthorized();
            int userId = int.Parse(userIdClaim);

            var item = await db.SepetUrunleri.FirstOrDefaultAsync(c => c.Id == id && c.KullaniciId == userId);
            
            if (item == null) return Results.NotFound(new { Mesaj = "Ürün sepette bulunamadı." });

            db.SepetUrunleri.Remove(item);
            await db.SaveChangesAsync();
            
            return Results.Ok(new { Mesaj = "Ürün sepetten silindi." });
        });

        // 4. YENİ: SEPETTEKİ ÜRÜNÜN MİKTARINI GÜNCELLE (PUT)
        group.MapPut("/{id}", async (int id, MiktarGuncelleDTO dto, HttpContext context, AppDbContext db) =>
        {
            var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Results.Unauthorized();
            int userId = int.Parse(userIdClaim);

            var item = await db.SepetUrunleri.FirstOrDefaultAsync(c => c.Id == id && c.KullaniciId == userId);
            
            if (item == null) return Results.NotFound(new { Mesaj = "Ürün sepette bulunamadı." });

            item.Miktar = dto.Miktar;
            await db.SaveChangesAsync();
            
            return Results.Ok(new { Mesaj = "Miktar başarıyla güncellendi." });
        });
    }
}