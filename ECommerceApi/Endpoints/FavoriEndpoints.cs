using ECommerceApi.DataAccess;
using ECommerceApi.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ECommerceApi.Endpoints;

public record FavoriEkleDTO(int UrunId);

public static class FavoriEndpoints
{
    public static void MapFavoriEndpoints(this WebApplication app)
    {
        // RequireAuthorization() ekleyerek bu gruptaki tüm endpoint'leri Token zorunlu hale getiriyoruz
        var group = app.MapGroup("/api/favoriler").RequireAuthorization(); 

        // --- 1. FAVORİ EKLE ---
        group.MapPost("/", async (FavoriEkleDTO dto, HttpContext context, AppDbContext db) =>
        {
            // Token'ın içinden giriş yapan kullanıcının ID'sini (Sub claim) çekiyoruz
            var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Results.Unauthorized();
            int kullaniciId = int.Parse(userIdClaim);

            // Veritabanı Şişmesini Önleme Kontrolü: Bu ürün zaten favorilerde var mı?
            var zatenVarMi = await db.Favoriler.AnyAsync(f => f.KullaniciId == kullaniciId && f.UrunId == dto.UrunId);
            if (zatenVarMi) return Results.BadRequest(new { Mesaj = "Bu ürün zaten favorilerinizde." });

            var yeniFavori = new Favori
            {
                KullaniciId = kullaniciId,
                UrunId = dto.UrunId
            };

            db.Favoriler.Add(yeniFavori);
            await db.SaveChangesAsync();

            return Results.Ok(new { Mesaj = "Ürün favorilere eklendi." });
        });

        // --- 2. KULLANICININ KENDİ FAVORİLERİNİ LİSTELE ---
    group.MapGet("/", async (HttpContext context, AppDbContext db) =>
    {
        var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Results.Unauthorized();
        int kullaniciId = int.Parse(userIdClaim);

        var favoriler = await db.Favoriler
            .Include(f => f.Urunler)
            .Where(f => f.KullaniciId == kullaniciId)
            .Select(f => new 
            {
                FavoriId = f.Id,
                UrunId = f.UrunId, // Navigation property yerine doğrudan ID alanını kullanıyoruz
                // Güvenli erişim: Eğer Urunler null ise "Bilgi Yok" yaz, değilse ismini getir
                Ad = f.Urunler != null ? f.Urunler.Ad : "Ürün Silinmiş", 
                Fiyat = f.Urunler != null ? f.Urunler.Fiyat : 0,
                ResimUrl = f.Urunler != null ? f.Urunler.ResimUrl : ""
            })
            .ToListAsync();

        return Results.Ok(favoriler);
    });

        // --- 3. FAVORİDEN ÇIKAR (SİL) ---
        group.MapDelete("/{urunId}", async (int urunId, HttpContext context, AppDbContext db) =>
        {
            var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Results.Unauthorized();
            int kullaniciId = int.Parse(userIdClaim);

            var favori = await db.Favoriler.FirstOrDefaultAsync(f => f.KullaniciId == kullaniciId && f.UrunId == urunId);
            
            if (favori == null) return Results.NotFound(new { Mesaj = "Bu ürün favorilerinizde bulunamadı." });

            db.Favoriler.Remove(favori);
            await db.SaveChangesAsync();

            return Results.Ok(new { Mesaj = "Ürün favorilerden çıkarıldı." });
        });
    }
}