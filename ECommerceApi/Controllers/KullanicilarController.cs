using ECommerceApi.DTOs;
using ECommerceApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace ECommerceApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class KullanicilarController : ControllerBase
{
    private readonly IKullaniciService _kullaniciService;

    public KullanicilarController(IKullaniciService kullaniciService)
    {
        _kullaniciService = kullaniciService;
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> TumKullanicilariGetir()
    {
        var kullanicilar = await _kullaniciService.TumKullanicilariGetirAsync();
        return Ok(kullanicilar);
    }

    [Authorize]
    [HttpGet("profil")]
    public async Task<IActionResult> ProfilGetir()
    {
        var userIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value 
                          ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                          
        if (userIdClaim == null) return Unauthorized();
        int userId = int.Parse(userIdClaim);

        var kullanici = await _kullaniciService.ProfilBilgileriniGetirAsync(userId);
        if (kullanici == null) return NotFound(new { Mesaj = "Kullanıcı bulunamadı." });

        return Ok(kullanici);
    }

    [HttpPost("kayit")]
    public async Task<IActionResult> KayitOl([FromBody] KayitDTO dto)
    {
        var sonuc = await _kullaniciService.KayitOlAsync(dto);
        
        if (!sonuc.Basarili) return BadRequest(new { Mesaj = sonuc.Mesaj });

        return Ok(new { Mesaj = sonuc.Mesaj });
    }

    [HttpPost("giris")]
    public async Task<IActionResult> GirisYap([FromBody] GirisDTO dto)
    {
        var sonuc = await _kullaniciService.GirisYapAsync(dto);
        
        if (!sonuc.Basarili) return Unauthorized(new { Mesaj = sonuc.Mesaj });

        return Ok(new { 
            Token = sonuc.Token, 
            RefreshToken = sonuc.RefreshToken,
            Rol = sonuc.Rol, 
            Mesaj = sonuc.Mesaj,
            KullaniciId = sonuc.KullaniciId
        });
    }

    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken([FromBody] TokenRequestDTO dto)
    {
        var sonuc = await _kullaniciService.YeniTokenUretAsync(dto.RefreshToken);

        if (!sonuc.Basarili) return Unauthorized(new { Mesaj = sonuc.Mesaj });

        return Ok(new {
            Token = sonuc.Token,
            RefreshToken = sonuc.RefreshToken
        });
    }

    // =========================================================================
    // YENİ EKLENEN KISIM: ŞİFRE SIFIRLAMA ENDPOINTLERİ
    // =========================================================================

    [HttpPost("sifremi-unuttum")]
    public async Task<IActionResult> SifremiUnuttum([FromBody] SifremiUnuttumDto dto)
    {
        var sonuc = await _kullaniciService.SifremiUnuttumAsync(dto.Email);
        
        // YENİ: Başarısızsa (Kullanıcı yoksa) hata (400) fırlat
        if (!sonuc.Basarili) return BadRequest(new { Mesaj = sonuc.Mesaj });

        return Ok(new { Mesaj = sonuc.Mesaj });
    }

    [HttpPost("sifre-sifirla")]
    public async Task<IActionResult> SifreSifirla([FromBody] SifreSifirlaDto dto)
    {
        var sonuc = await _kullaniciService.SifreSifirlaAsync(dto.Email, dto.Kod, dto.YeniSifre);
        
        if (!sonuc.Basarili) return BadRequest(new { Mesaj = sonuc.Mesaj });

        return Ok(new { Mesaj = sonuc.Mesaj });
    }
}