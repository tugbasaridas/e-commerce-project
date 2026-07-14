using ECommerceApi.Entities;
using ECommerceApi.DTOs;
using ECommerceApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ECommerceApi.Controllers;

[ApiController]
[Route("api/[controller]")] // Bu satır otomatik olarak /api/urunler yolunu oluşturur
public class UrunlerController : ControllerBase
{
    private readonly IUrunService _urunService;

    // Servisimizi bağlıyoruz
    public UrunlerController(IUrunService urunService)
    {
        _urunService = urunService;
    }

    [HttpGet]
    public async Task<IActionResult> GetUrunler()
    {
        var urunler = await _urunService.TumUrunleriGetirAsync();
        return Ok(urunler);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetUrunById(int id)
    {
        var urun = await _urunService.UrunGetirByIdAsync(id);
        if (urun is null) return NotFound("Ürün bulunamadı.");
        
        return Ok(urun);
    }

    [HttpPost]
    public async Task<IActionResult> UrunEkle([FromBody] UrunEkleDTO dto) 
    {
        var eklenenUrun = await _urunService.UrunEkleAsync(dto);
        return Created($"/api/urunler/{eklenenUrun.Id}", eklenenUrun);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> UrunSil(int id)
    {
        var sonuc = await _urunService.UrunSilAsync(id);
        if (!sonuc) return NotFound();
        
        return NoContent();
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UrunGuncelle(int id, [FromBody] UrunGuncelleDto guncelUrun)
    {
        var guncellenenUrun = await _urunService.UrunGuncelleAsync(id, guncelUrun);
        if (guncellenenUrun is null) return NotFound("Güncellenecek ürün bulunamadı.");
        
        return Ok(guncellenenUrun);
    }

    [Authorize]
    [HttpPost("{urunId}/oyla")]
    public async Task<IActionResult> UrunOyla(int urunId, [FromQuery] int puan)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized();
        
        int userId = int.Parse(userIdClaim);

        var (basarili, mesaj) = await _urunService.UrunOylaAsync(urunId, userId, puan);
        
        if (!basarili) return BadRequest(new { mesaj });
        
        return Ok(new { mesaj });
    }

    
[HttpGet("indirimdekiler")]
public async Task<IActionResult> GetIndirimdekiler()
{
    var urunler = await _urunService.IndirimliUrunleriGetirAsync();
    return Ok(urunler);
}
}