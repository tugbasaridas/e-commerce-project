using ECommerceApi.DataAccess;
using ECommerceApi.Entities;
using Microsoft.AspNetCore.Authorization; 
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ECommerceApi.Endpoints;

public record KayitDTO(string AdSoyad, string Email, string Sifre);
public record GirisDTO(string Email, string Sifre);

public static class KullaniciEndpoints
{
    public static void MapKullaniciEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/kullanicilar");

        // --- TÜM KULLANICILARI GETİR (SADECE ADMİNLER GÖREBİLİR) ---
        group.MapGet("/", [Authorize(Roles = "Admin")] async (AppDbContext db) =>
        {
            var kullanicilar = await db.Kullanicilar
                .Select(k => new 
                { 
                    k.Id, 
                    k.AdSoyad, 
                    k.Email, 
                    k.Rol, 
                    k.OlusturulmaTarihi 
                })
                .ToListAsync();

            return Results.Ok(kullanicilar);
        });

        // --- GİRİŞ YAPAN KULLANICININ KENDİ PROFİL BİLGİLERİNİ GETİR ---
        group.MapGet("/profil", [Authorize] async (HttpContext context, AppDbContext db) =>
        {
            // JWT Token'ın içinden "Sub" (Subject = Kullanıcı Id) değerini çekiyoruz
            var userIdClaim = context.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value 
                              ?? context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                              
            if (userIdClaim == null) return Results.Unauthorized();
            int userId = int.Parse(userIdClaim);

            var kullanici = await db.Kullanicilar
                .Where(k => k.Id == userId)
                .Select(k => new 
                {
                    AdSoyad = k.AdSoyad,
                    Email = k.Email,
                    Rol = k.Rol
                })
                .FirstOrDefaultAsync();

            if (kullanici == null) return Results.NotFound(new { Mesaj = "Kullanıcı bulunamadı." });

            return Results.Ok(kullanici);
        });

        // --- KAYIT OL ENDPOINT'İ ---
        group.MapPost("/kayit", async (KayitDTO dto, AppDbContext db) =>
        {
            // 1. E-posta Formatı Güvenlik Kontrolü (YENİ EKLENDİ)
            var emailRegex = new System.Text.RegularExpressions.Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$");
            if (!emailRegex.IsMatch(dto.Email))
            {
                return Results.BadRequest(new { Mesaj = "Geçersiz e-posta formatı. Lütfen kontrol ediniz." });
            }

            // 2. E-posta Mevcudiyet Kontrolü
            var mevcut = await db.Kullanicilar.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (mevcut != null) return Results.BadRequest(new { Mesaj = "Bu e-posta zaten kayıtlı." });

            // 3. Kullanıcıyı Oluştur ve Kaydet
            var yeniKullanici = new Kullanicilar
            {
                AdSoyad = dto.AdSoyad,
                Email = dto.Email,
                SifreHash = BCrypt.Net.BCrypt.HashPassword(dto.Sifre),
                Rol = "Kullanici" // Varsayılan rol
            };

            db.Kullanicilar.Add(yeniKullanici);
            await db.SaveChangesAsync();
            
            return Results.Ok(new { Mesaj = "Kayıt başarılı." });
        });

        // --- GİRİŞ YAP VE TOKEN ÜRET ENDPOINT'İ ---
        group.MapPost("/giris", async (GirisDTO dto, AppDbContext db, IConfiguration config) =>
        {
            var kullanici = await db.Kullanicilar.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (kullanici == null) return Results.Unauthorized();

            bool sifreDogruMu = BCrypt.Net.BCrypt.Verify(dto.Sifre, kullanici.SifreHash);
            if (!sifreDogruMu) return Results.Unauthorized();

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, kullanici.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, kullanici.Email),
                new Claim(ClaimTypes.Role, kullanici.Rol) 
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: config["Jwt:Issuer"],
                audience: config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            return Results.Ok(new { 
                Token = tokenString, 
                Rol = kullanici.Rol, 
                Mesaj = "Giriş başarılı" 
            });
        });
    }
}