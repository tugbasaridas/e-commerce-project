using ECommerceApi.DataAccess;
using ECommerceApi.Entities;
using ECommerceApi.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;

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
            .Select(k => new 
            { 
                k.Id, 
                k.AdSoyad, 
                k.Email, 
                k.Rol, 
                k.OlusturulmaTarihi 
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

    public async Task<(bool Basarili, string Mesaj, string? Token, string? Rol, int? KullaniciId)> GirisYapAsync(GirisDTO dto)
    {
        var kullanici = await _db.Kullanicilar.FirstOrDefaultAsync(u => u.Email == dto.Email);
        
        // DÜZELTME: Sona 5. eleman olarak 'null' eklendi
        if (kullanici == null) return (false, "Kullanıcı bulunamadı veya şifre hatalı.", null, null, null);

        bool sifreDogruMu = BCrypt.Net.BCrypt.Verify(dto.Sifre, kullanici.SifreHash);
        
        // DÜZELTME: Sona 5. eleman olarak 'null' eklendi
        if (!sifreDogruMu) return (false, "Kullanıcı bulunamadı veya şifre hatalı.", null, null, null);

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
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        // DÜZELTME: Sona 5. eleman olarak 'kullanici.Id' eklendi
        return (true, "Giriş başarılı", tokenString, kullanici.Rol, kullanici.Id);
    }
}