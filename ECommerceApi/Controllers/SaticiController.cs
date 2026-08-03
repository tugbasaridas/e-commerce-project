using ECommerceApi.DataAccess; // AppDbContext için gerekli
using ECommerceApi.DTOs;
using ECommerceApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ECommerceApi.Controllers;

[Route("api/[controller]")]
[ApiController]
public class SaticiController : ControllerBase
{
    private readonly ISaticiService _saticiService;
    private readonly AppDbContext _context; // YENİ: Context eklendi

    public SaticiController(ISaticiService saticiService, AppDbContext context)
    {
        _saticiService = saticiService;
        _context = context; // YENİ: Dependency injection ile bağlandı
    }

    [HttpPost("basvuru")]
    [AllowAnonymous] 
    public async Task<IActionResult> SaticiKayit([FromBody] MagazaBasvuruDto dto)
    {
        try
        {
            await _saticiService.SaticiKayitAsync(dto);
            return Ok("Mağaza başvurunuz alındı, admin onayından sonra giriş yapabilirsiniz.");
        }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }

    [HttpPost("urun")]
    [Authorize(Roles = "Satici")]
    public async Task<IActionResult> UrunEkle([FromBody] SaticiUrunEkleDto dto)
    {
        int saticiId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        try
        {
            await _saticiService.UrunEkleAsync(saticiId, dto);
            return Ok("Ürün başarıyla mağazanıza eklendi.");
        }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }

    [HttpGet("urunlerim")]
    [Authorize(Roles = "Satici")]
    public async Task<IActionResult> KendiUrunlerimiGetir()
    {
        int saticiId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        try
        {
            var urunler = await _saticiService.KendiUrunlerimiGetirAsync(saticiId);
            return Ok(urunler);
        }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }

    [HttpPut("urun/{id}")]
    [Authorize(Roles = "Satici")]
    public async Task<IActionResult> UrunGuncelle(int id, [FromBody] SaticiUrunGuncelleDto dto)
    {
        int saticiId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        try
        {
            await _saticiService.UrunGuncelleAsync(saticiId, id, dto);
            return Ok("Ürün başarıyla güncellendi.");
        }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }

    [HttpDelete("urun/{id}")]
    [Authorize(Roles = "Satici")]
    public async Task<IActionResult> UrunSil(int id)
    {
        int saticiId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        try
        {
            await _saticiService.UrunSilAsync(saticiId, id);
            return Ok("Ürün mağazanızdan silindi.");
        }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }

    [HttpPost("urun/{id}/indirim")]
    [Authorize(Roles = "Satici")]
    public async Task<IActionResult> IndirimYap(int id, [FromBody] IndirimDTO dto)
    {
        int saticiId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var sonuc = await _saticiService.IndirimYapAsync(saticiId, id, dto.YeniFiyat, dto.Saat);
        if (!sonuc.Basarili) return BadRequest(sonuc.Mesaj);
        return Ok(sonuc.Mesaj);
    }

    [HttpDelete("urun/{id}/indirim")]
    [Authorize(Roles = "Satici")]
    public async Task<IActionResult> IndirimKaldir(int id)
    {
        int saticiId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var sonuc = await _saticiService.IndirimiKaldirAsync(saticiId, id);
        if (!sonuc.Basarili) return BadRequest(sonuc.Mesaj);
        return Ok(sonuc.Mesaj);
    }

    [HttpGet("siparislerim")]
    [Authorize(Roles = "Satici")]
    public async Task<IActionResult> SiparislerimiGetir()
    {
        int saticiId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        try
        {
            var siparisler = await _saticiService.KendiMagazamdakiSiparisleriGetirAsync(saticiId);
            return Ok(siparisler);
        }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }

    [HttpPut("siparis-detay/{detayId}/durum")]
    [Authorize(Roles = "Satici")]
    public async Task<IActionResult> SiparisKargoDurumuGuncelle(int detayId, [FromBody] SiparisDetayGuncelleDTO dto)
    {
        int saticiId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var sonuc = await _saticiService.SiparisDetayDurumGuncelleAsync(saticiId, detayId, dto);
        if (!sonuc.Basarili) return BadRequest(sonuc.Mesaj);
        return Ok(sonuc.Mesaj);
    }

    [HttpGet("yonetim/takipcilerim")]
    [Authorize(Roles = "Satici")]
    public async Task<IActionResult> TakipcilerimiGetir()
    {
        int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        
        var magaza = await _context.Magazalar.FirstOrDefaultAsync(m => m.KullaniciId == userId);
        if (magaza == null) return BadRequest(new { mesaj = "Mağazanız bulunamadı." });

        var takipciler = await _context.Takipciler
            .Include(t => t.Kullanici)
            .Where(t => t.MagazaId == magaza.Id)
            .Select(t => new 
            {
                id = t.KullaniciId,
                adSoyad = t.Kullanici != null ? (t.Kullanici.AdSoyad ?? "İsimsiz Kullanıcı") : "Bilinmeyen Kullanıcı",
                email = t.Kullanici != null ? t.Kullanici.Email : ""
            })
            .ToListAsync();

        return Ok(takipciler);
    }
}