using ECommerceApi.DataAccess;
using ECommerceApi.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace ECommerceApi.Endpoints;

// Dışarıdan gelecek verileri karşılamak için DTO'lar
public record DestekTalebiDTO(string Konu, string Mesaj);
public record DestekCevapDTO(string Cevap);

public static class DestekEndpoints
{
    public static void MapDestekEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/destek");

        // --- 1. KULLANICI: YENİ MESAJ GÖNDER ---
        group.MapPost("/", [Authorize] async (DestekTalebiDTO dto, HttpContext context, AppDbContext db) =>
        {
            // Token'dan giriş yapan kullanıcının ID'sini alıyoruz
            var userIdClaim = context.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value 
                              ?? context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                              
            if (userIdClaim == null) return Results.Unauthorized();
            int userId = int.Parse(userIdClaim);

            var yeniTalep = new DestekTalepleri
            {
                KullaniciId = userId,
                Konu = dto.Konu,
                Mesaj = dto.Mesaj,
                Durum = "Bekliyor", // Başlangıçta admin cevabı bekliyor
                OlusturulmaTarihi = DateTime.UtcNow
            };

            db.DestekTalepleri.Add(yeniTalep);
            await db.SaveChangesAsync();

            return Results.Ok(new { Mesaj = "Mesajınız başarıyla iletildi. En kısa sürede yanıtlayacağız." });
        });

        // --- 2. KULLANICI: KENDİ GEÇMİŞ MESAJLARINI VE CEVAPLARI GÖR ---
        group.MapGet("/kullanici", [Authorize] async (HttpContext context, AppDbContext db) =>
        {
            var userIdClaim = context.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value 
                              ?? context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                              
            if (userIdClaim == null) return Results.Unauthorized();
            int userId = int.Parse(userIdClaim);

            var talepler = await db.DestekTalepleri
                .Where(d => d.KullaniciId == userId)
                .OrderByDescending(d => d.OlusturulmaTarihi) // En yeniler en üstte
                .Select(d => new 
                { 
                    d.Id, 
                    d.Konu, 
                    d.Mesaj, 
                    d.AdminCevabi, 
                    d.Durum, 
                    d.OlusturulmaTarihi, 
                    d.CevaplanmaTarihi 
                })
                .ToListAsync();

            return Results.Ok(talepler);
        });

        // --- 3. ADMİN: TÜM MESAJLARI (ÖZELLİKLE BEKLEYENLERİ) GÖR ---
        group.MapGet("/admin", [Authorize(Roles = "Admin")] async (AppDbContext db) =>
        {
            var talepler = await db.DestekTalepleri
                .Include(d => d.Kullanici) // Kullanıcının adını da getirmek için
                .OrderBy(d => d.Durum == "Bekliyor" ? 0 : 1) // Bekleyenler her zaman en üstte çıksın
                .ThenByDescending(d => d.OlusturulmaTarihi)
                .Select(d => new 
                { 
                    d.Id, 
                    KullaniciAdi = d.Kullanici.AdSoyad, 
                    KullaniciEmail = d.Kullanici.Email,
                    d.Konu, 
                    d.Mesaj, 
                    d.AdminCevabi, 
                    d.Durum, 
                    d.OlusturulmaTarihi 
                })
                .ToListAsync();

            return Results.Ok(talepler);
        });

        // --- 4. ADMİN: KULLANICIYA CEVAP YAZ ---
        group.MapPut("/cevapla/{id}", [Authorize(Roles = "Admin")] async (int id, DestekCevapDTO dto, AppDbContext db) =>
        {
            var talep = await db.DestekTalepleri.FindAsync(id);
            if (talep == null) return Results.NotFound(new { Mesaj = "Talep bulunamadı." });

            talep.AdminCevabi = dto.Cevap;
            talep.Durum = "Cevaplandı"; // Durumu güncelledik
            talep.CevaplanmaTarihi = DateTime.UtcNow;

            await db.SaveChangesAsync();

            return Results.Ok(new { Mesaj = "Kullanıcıya başarıyla cevap verildi." });
        });
    }
}