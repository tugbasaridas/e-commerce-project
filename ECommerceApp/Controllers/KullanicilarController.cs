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
        var (basarili, mesaj) = await _kullaniciService.KayitOlAsync(dto);
        
        if (!basarili) return BadRequest(new { Mesaj = mesaj });

        return Ok(new { Mesaj = mesaj });
    }

   [HttpPost("giris")]
public async Task<IActionResult> GirisYap([FromBody] GirisDTO dto)
{
    var (basarili, mesaj, token, refreshToken, rol, kullaniciId) = await _kullaniciService.GirisYapAsync(dto);
    
    if (!basarili) return Unauthorized(new { Mesaj = mesaj });

    return Ok(new { 
        Token = token, 
        RefreshToken = refreshToken, // Artık frontend'e gönderiyoruz
        Rol = rol, 
        Mesaj = mesaj,
        KullaniciId = kullaniciId
    });
}

// YENİ ENDPOINT: Frontend'in 15 dakikada bir çağıracağı yer
[HttpPost("refresh-token")]
public async Task<IActionResult> RefreshToken([FromBody] TokenRequestDTO dto)
{
    var (basarili, mesaj, yeniToken, yeniRefreshToken) = await _kullaniciService.YeniTokenUretAsync(dto.RefreshToken);

    if (!basarili) return Unauthorized(new { Mesaj = mesaj });

    return Ok(new {
        Token = yeniToken,
        RefreshToken = yeniRefreshToken
    });
}
}