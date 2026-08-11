using ECommerceApi.DTOs;
using ECommerceApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace ECommerceApi.Controllers;

[Route("api/[controller]")]
[ApiController]
public class VitrinController : ControllerBase
{
    private readonly IVitrinService _vitrinService;

    public VitrinController(IVitrinService vitrinService) 
    {
        _vitrinService = vitrinService;
    }

    [HttpGet("bannerlar")]
    public async Task<IActionResult> TumBannerlariGetir()
    {
        var bannerlar = await _vitrinService.TumVitrinBannerlariGetirAsync();
        return Ok(bannerlar);
    }

    
    [HttpGet("indirimli-urunler")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> IndirimliUrunleriGetir()
    {
        var urunler = await _vitrinService.IndirimliUrunleriGetirAsync();
        return Ok(urunler);
    }

    [HttpPost("banner-ekle")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> BannerEkle([FromBody] VitrinBannerDto dto)
    {
        var (basarili, mesaj) = await _vitrinService.VitrinBannerEkleAsync(dto);
        if (!basarili) return BadRequest(new { Message = mesaj });

        return Ok(new { Message = mesaj });
    }

    [HttpPut("banner-durum/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> BannerDurumGuncelle(int id, [FromBody] bool aktifMi)
    {
        var (basarili, mesaj) = await _vitrinService.VitrinBannerDurumGuncelleAsync(id, aktifMi);
        if (!basarili) return BadRequest(new { Message = mesaj });

        return Ok(new { Message = mesaj });
    }

    [HttpDelete("banner-sil/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> BannerSil(int id)
    {
        var (basarili, mesaj) = await _vitrinService.VitrinBannerSilAsync(id);
        if (!basarili) return BadRequest(new { Message = mesaj });

        return Ok(new { Message = mesaj });
    }

    [HttpPut("banner-sira/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> BannerSiraGuncelle(int id, [FromBody] int yeniSira)
    {
        var (basarili, mesaj) = await _vitrinService.VitrinBannerSiraGuncelleAsync(id, yeniSira);
        if (!basarili) return BadRequest(new { Message = mesaj });

        return Ok(new { Message = mesaj });
    }
}