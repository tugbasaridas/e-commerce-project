using ECommerceApi.DataAccess;
using ECommerceApi.Entities;
using ECommerceApi.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using System.Security.Cryptography;

namespace ECommerceApi.Services;

public class KullaniciService : IKullaniciService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly IKuponService _kuponService;

    public KullaniciService(AppDbContext db, IConfiguration config, IKuponService kuponService)
    {
        _db = db;
        _config = config;
        _kuponService = kuponService;
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
                k.OlusturulmaTarihi,
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
            return (false, "Geçersiz e-posta formatı. Lütfen kontrol ediniz.");

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
        
        await _kuponService.YeniKullaniciyaHosgeldinKuponuVerAsync(yeniKullanici.Id);

        return (true, "Kayıt başarılı.");
    }

    public async Task<(bool Basarili, string Mesaj, string? Token, string? RefreshToken, string? Rol, int? KullaniciId)> GirisYapAsync(GirisDTO dto)
    {
        var kullanici = await _db.Kullanicilar.FirstOrDefaultAsync(u => u.Email == dto.Email);
        
        if (kullanici == null) return (false, "Kullanıcı bulunamadı veya şifre hatalı.", null, null, null, null);

        if (kullanici.IsDeleted) 
            return (false, "Hesabınız yönetici tarafından silinmiş veya askıya alınmıştır.", null, null, null, null);

        bool sifreDogruMu = BCrypt.Net.BCrypt.Verify(dto.Sifre, kullanici.SifreHash);
        
        if (!sifreDogruMu) return (false, "Kullanıcı bulunamadı veya şifre hatalı.", null, null, null, null);

        if (kullanici.Rol == "Satici")
        {
            var magaza = await _db.Magazalar.FirstOrDefaultAsync(m => m.KullaniciId == kullanici.Id);
            
            if (magaza != null && magaza.OnaylandiMi == false)
            {
                return (false, "Mağaza başvurunuz yöneticiler tarafından değerlendirilmektedir. Onaylandıktan sonra giriş yapabilirsiniz.", null, null, null, null);
            }
        }

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, kullanici.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, kullanici.Email),
            new Claim(ClaimTypes.Role, kullanici.Rol) 
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: creds
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
        var refreshToken = RastgeleTokenOlustur();
        
        kullanici.RefreshToken = refreshToken;
        kullanici.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7); 
        
        await _db.SaveChangesAsync();

        return (true, "Giriş başarılı", tokenString, refreshToken, kullanici.Rol, kullanici.Id);
    }

    public async Task<(bool Basarili, string Mesaj, string? Token, string? RefreshToken)> YeniTokenUretAsync(string mevcutRefreshToken)
    {
        var kullanici = await _db.Kullanicilar.FirstOrDefaultAsync(u => u.RefreshToken == mevcutRefreshToken);

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

    // =========================================================================================
    // YENİ EKLENEN KISIM: ŞİFRE SIFIRLAMA İŞLEMLERİ (SİMÜLE EDİLMİŞ)
    // =========================================================================================
    
   public async Task<(bool Basarili, string Mesaj)> SifremiUnuttumAsync(string email)
    {
        var kullanici = await _db.Kullanicilar.FirstOrDefaultAsync(k => k.Email == email);
        
        // YENİ: Kullanıcı yoksa artık doğrudan hata mesajı dönüyoruz
        if (kullanici == null) 
            return (false, "Sistemde bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı.");

        // 6 haneli kod üret
        var random = new Random();
        var kod = random.Next(100000, 999999).ToString();

        kullanici.PasswordResetToken = kod;
        kullanici.PasswordResetTokenExpires = DateTime.UtcNow.AddMinutes(15);
        await _db.SaveChangesAsync();

        Console.WriteLine("\n\n==================================================");
        Console.WriteLine($"[ŞİFRE SIFIRLAMA] E-Posta: {email}");
        Console.WriteLine($"[ŞİFRE SIFIRLAMA] Doğrulama Kodunuz: {kod}");
        Console.WriteLine($"[ŞİFRE SIFIRLAMA] Geçerlilik Süresi: 15 Dakika");
        Console.WriteLine("==================================================\n\n");

        return (true, "Şifre sıfırlama kodu oluşturuldu. Lütfen konsolu kontrol ediniz.");
    }

    public async Task<(bool Basarili, string Mesaj)> SifreSifirlaAsync(string email, string kod, string yeniSifre)
    {
        var kullanici = await _db.Kullanicilar.FirstOrDefaultAsync(k => k.Email == email);

        if (kullanici == null || kullanici.PasswordResetToken != kod)
            return (false, "Hatalı e-posta adresi veya geçersiz doğrulama kodu.");

        if (kullanici.PasswordResetTokenExpires < DateTime.UtcNow)
            return (false, "Sıfırlama kodunun süresi dolmuş. Lütfen yeni bir kod isteyin.");

        // Şifreyi yeni değerle güncelle ve Hash'le
        kullanici.SifreHash = BCrypt.Net.BCrypt.HashPassword(yeniSifre);

        // Kullanılan token'ı temizle
        kullanici.PasswordResetToken = null;
        kullanici.PasswordResetTokenExpires = null;

        await _db.SaveChangesAsync();

        return (true, "Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.");
    }
    // =========================================================================================

    private string RastgeleTokenOlustur()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    public async Task<(bool Basarili, string Mesaj)> SifreDegistirAsync(int kullaniciId, SifreDegistirDTO dto)
    {
        if (dto.YeniSifre != dto.YeniSifreTekrar)
            return (false, "Yeni şifreler birbiriyle uyuşmuyor.");

        if (dto.YeniSifre.Length < 6)
            return (false, "Yeni şifreniz en az 6 karakter olmalıdır.");

        // 🌟 YENİ EKLENEN KONTROL: En az 1 büyük harf zorunluluğu
        if (!dto.YeniSifre.Any(char.IsUpper))
            return (false, "Yeni şifreniz en az 1 büyük harf içermelidir.");

        var kullanici = await _db.Kullanicilar.FindAsync(kullaniciId);
        if (kullanici == null)
            return (false, "Kullanıcı bulunamadı.");

        // KURAL 1: Eski şifre doğru mu?
        bool eskiSifreDogruMu = BCrypt.Net.BCrypt.Verify(dto.EskiSifre, kullanici.SifreHash);
        if (!eskiSifreDogruMu)
            return (false, "Mevcut şifrenizi yanlış girdiniz. Lütfen tekrar deneyin.");

        // KURAL 2: Yeni şifre, eski şifreyle aynı olmamalı!
        bool sifreAyniMi = BCrypt.Net.BCrypt.Verify(dto.YeniSifre, kullanici.SifreHash);
        if (sifreAyniMi)
            return (false, "Güvenliğiniz için yeni şifreniz, mevcut şifrenizle aynı olamaz.");

        // Kurallardan geçildi, şifreyi güncelle ve veritabanına kaydet
        kullanici.SifreHash = BCrypt.Net.BCrypt.HashPassword(dto.YeniSifre);
        
        await _db.SaveChangesAsync();

        return (true, "Şifreniz başarıyla güncellendi.");
    }
}