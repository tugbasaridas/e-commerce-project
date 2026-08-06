using ECommerceApi.DTOs;
using ECommerceApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ECommerceApi.Controllers;

[Route("api/[controller]")]
[ApiController]
public class UrunSoruController : ControllerBase
{
    private readonly IUrunSoruService _soruService;

    public UrunSoruController(IUrunSoruService soruService)
    {
        _soruService = soruService;
    }

    // HERKES GÖREBİLİR (Detay sayfasında soruları listeleme)
    [HttpGet("urun/{urunId}")]
    public async Task<IActionResult> UrunSorulariniGetir(int urunId)
    {
        var sorular = await _soruService.UrunSorulariniGetirAsync(urunId);
        return Ok(sorular);
    }

    // SADECE GİRİŞ YAPANLAR (Müşteri soru sorarken)
    [Authorize]
    [HttpPost("sor")]
    public async Task<IActionResult> SoruSor([FromBody] SoruEkleDTO dto)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr)) return Unauthorized("Kullanıcı kimliği bulunamadı.");

        int userId = int.Parse(userIdStr);
        var sonuc = await _soruService.SoruSorAsync(userId, dto);
        
        if (!sonuc.Basarili) return BadRequest(new { mesaj = sonuc.Mesaj });
        return Ok(new { mesaj = sonuc.Mesaj });
    }

    // SADECE SATICILAR (Kendi mağazasına gelen soruları listeler)
    [Authorize(Roles = "Satici, Satıcı")]
    [HttpGet("satici-sorulari")]
    public async Task<IActionResult> SaticiSorulariniGetir()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

        int userId = int.Parse(userIdStr);
        var sorular = await _soruService.SaticiSorulariniGetirAsync(userId);
        return Ok(sorular);
    }

    // SADECE SATICILAR (Gelen soruyu cevaplar)
    [Authorize(Roles = "Satici, Satıcı")]
    [HttpPost("cevapla/{soruId}")]
    public async Task<IActionResult> SoruCevapla(int soruId, [FromBody] SoruCevaplaDTO dto)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

        int userId = int.Parse(userIdStr);
        var sonuc = await _soruService.SoruCevaplaAsync(userId, soruId, dto);
        
        if (!sonuc.Basarili) return BadRequest(new { mesaj = sonuc.Mesaj });
        return Ok(new { mesaj = sonuc.Mesaj });
    }
}