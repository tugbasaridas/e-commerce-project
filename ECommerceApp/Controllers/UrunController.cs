
using ECommerceApi.DTOs;
using ECommerceApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ECommerceApi.Controllers;

[Route("api/[controller]")]
[ApiController]
public class UrunController : ControllerBase
{
    private readonly IUrunService _urunService;
    public UrunController(IUrunService urunService) => _urunService = urunService;

    [HttpGet]
    [AllowAnonymous] // Herkes görebilir
    public async Task<IActionResult> TumUrunleriGetir()
    {
        var urunler = await _urunService.TumUrunleriGetirAsync();
        return Ok(urunler);
    }

    [HttpGet("indirimli")]
    [AllowAnonymous]
    public async Task<IActionResult> IndirimliUrunleriGetir()
    {
        var urunler = await _urunService.IndirimliUrunleriGetirAsync();
        return Ok(urunler);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> UrunGetirById(int id)
    {
        var urun = await _urunService.UrunGetirByIdAsync(id);
        if (urun == null) return NotFound("Ürün bulunamadı veya şu an satışta değil.");
        return Ok(urun);
    }

    [HttpPost("{id}/oyla")]
    [Authorize(Roles = "Kullanici")] // Sadece kayıtlı müşteriler oylayabilir
    public async Task<IActionResult> UrunOyla(int id, [FromBody] OylamaDto dto)
    {
        int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var sonuc = await _urunService.UrunOylaAsync(id, userId, dto.Puan, dto.Yorum);
        if (!sonuc.Basarili) return BadRequest(sonuc.Mesaj);
        return Ok(sonuc.Mesaj);
    }
}

