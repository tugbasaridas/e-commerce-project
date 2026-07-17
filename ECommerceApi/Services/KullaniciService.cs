using ECommerceApi.DataAccess;
using ECommerceApi.Entities;
using ECommerceApi.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using System.Security.Cryptography; // YENİ: Rastgele token üretmek için gerekli

namespace ECommerceApi.Services;

public class KullaniciService : IKullaniciService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public KullaniciService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<object> TumKullanicilariGetirAsync()
    {
        return await _db.Kullanicilar
            .IgnoreQueryFilters()
            .Select(k => new 
            { 
                k.Id, 
                k.AdSoyad, 
                k.Email, 
                k.Rol, 
                k.OlusturulmaTarihi ,
                k.IsDeleted
            })
            .ToListAsync();
    }

    public async Task<object?> ProfilBilgileriniGetirAsync(int userId)
    {
        return await _db.Kullanicilar
            .Where(k => k.Id == userId)
            .Select(k => new 
            {
                k.AdSoyad,
                k.Email,
                k.Rol
            })
            .FirstOrDefaultAsync();
    }

    public async Task<(bool Basarili, string Mesaj)> KayitOlAsync(KayitDTO dto)
    {
        var emailRegex = new Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$");
        if (!emailRegex.IsMatch(dto.Email))
        {
            return (false, "Geçersiz e-posta formatı. Lütfen kontrol ediniz.");
        }

        var mevcut = await _db.Kullanicilar.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (mevcut != null) return (false, "Bu e-posta zaten kayıtlı.");

        var yeniKullanici = new Kullanicilar
        {
            AdSoyad = dto.AdSoyad,
            Email = dto.Email,
            SifreHash = BCrypt.Net.BCrypt.HashPassword(dto.Sifre),
            Rol = "Kullanici"
        };

        _db.Kullanicilar.Add(yeniKullanici);
        await _db.SaveChangesAsync();
        
        return (true, "Kayıt başarılı.");
    }

    // YENİ: Dönüş tipine 'string? RefreshToken' eklendi
    public async Task<(bool Basarili, string Mesaj, string? Token, string? RefreshToken, string? Rol, int? KullaniciId)> GirisYapAsync(GirisDTO dto)
    {
        var kullanici = await _db.Kullanicilar.FirstOrDefaultAsync(u => u.Email == dto.Email);
        
        if (kullanici == null) return (false, "Kullanıcı bulunamadı veya şifre hatalı.", null, null, null, null);

        if (kullanici.IsDeleted) 
        {
            return (false, "Hesabınız yönetici tarafından silinmiş veya askıya alınmıştır.", null, null, null, null);
        }

        bool sifreDogruMu = BCrypt.Net.BCrypt.Verify(dto.Sifre, kullanici.SifreHash);
        
        if (!sifreDogruMu) return (false, "Kullanıcı bulunamadı veya şifre hatalı.", null, null, null, null);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, kullanici.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, kullanici.Email),
            new Claim(ClaimTypes.Role, kullanici.Rol) 
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Access Token süresi güvenlik için 15 DAKİKAYA düşürüldü
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: creds
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        // YENİ: Refresh Token oluştur ve veritabanına kaydet
        var refreshToken = RastgeleTokenOlustur();
        kullanici.RefreshToken = refreshToken;
        kullanici.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7); // Refresh token 7 gün geçerli
        
        await _db.SaveChangesAsync();

        return (true, "Giriş başarılı", tokenString, refreshToken, kullanici.Rol, kullanici.Id);
    }

    // YENİ: Sisteme yeni token alma metodu eklendi
    public async Task<(bool Basarili, string Mesaj, string? Token, string? RefreshToken)> YeniTokenUretAsync(string mevcutRefreshToken)
    {
        var kullanici = await _db.Kullanicilar.FirstOrDefaultAsync(u => u.RefreshToken == mevcutRefreshToken);

        // Kullanıcı yoksa veya token süresi dolmuşsa reddet
        if (kullanici == null || kullanici.RefreshTokenExpiryTime <= DateTime.UtcNow)
        {
            return (false, "Geçersiz veya süresi dolmuş oturum. Lütfen tekrar giriş yapın.", null, null);
        }

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, kullanici.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, kullanici.Email),
            new Claim(ClaimTypes.Role, kullanici.Rol) 
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var yeniAccessToken = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: creds
        );

        var yeniRefreshToken = RastgeleTokenOlustur();
        kullanici.RefreshToken = yeniRefreshToken;
        kullanici.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        
        await _db.SaveChangesAsync();

        return (true, "Başarılı", new JwtSecurityTokenHandler().WriteToken(yeniAccessToken), yeniRefreshToken);
    }

    // YARDIMCI METOT: Kriptografik olarak güvenli rastgele metin üretici
    private string RastgeleTokenOlustur()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }
}