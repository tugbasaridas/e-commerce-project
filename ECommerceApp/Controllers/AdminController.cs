using ECommerceApi.DTOs;
using ECommerceApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceApi.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin")] // Tüm controller Admin'e özel
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    public AdminController(IAdminService adminService) => _adminService = adminService;

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var istatistikler = await _adminService.GetDashboardIstatistikleriAsync();
        return Ok(istatistikler);
    }

    [HttpGet("magazalar")]
    public async Task<IActionResult> TumMagazalariGetir()
    {
        var magazalar = await _adminService.TumMagazalariGetirAsync();
        return Ok(magazalar);
    }

    [HttpGet("magazalar/bekleyen")]
    public async Task<IActionResult> BekleyenMagazalariGetir()
    {
        var magazalar = await _adminService.BekleyenMagazalariGetirAsync();
        return Ok(magazalar);
    }

    [HttpPut("magaza/{id}/onayla")]
    public async Task<IActionResult> MagazaOnayla(int id)
    {
        try
        {
            await _adminService.MagazaOnaylaAsync(id);
            return Ok("Mağaza başarıyla onaylandı.");
        }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }

    [HttpDelete("magaza/{id}/reddet")]
    public async Task<IActionResult> MagazaReddet(int id)
    {
        var sonuc = await _adminService.MagazaReddetAsync(id);
        if (!sonuc.Basarili) return BadRequest(sonuc.Mesaj);
        return Ok(sonuc.Mesaj);
    }

    [HttpDelete("kullanici/{id}/sil")]
    public async Task<IActionResult> KullaniciAskisyaAl(int id)
    {
        var sonuc = await _adminService.KullaniciSilAsync(id);
        if (!sonuc.Basarili) return BadRequest(sonuc.Mesaj);
        return Ok(sonuc.Mesaj);
    }

    [HttpPut("kullanici/{id}/aktiflestir")]
    public async Task<IActionResult> KullaniciAktiflestir(int id)
    {
        var sonuc = await _adminService.KullaniciAktiflestirAsync(id);
        if (!sonuc.Basarili) return BadRequest(sonuc.Mesaj);
        return Ok(sonuc.Mesaj);
    }

    [HttpGet("siparisler")]
    public async Task<IActionResult> TumSiparisleriGetir()
    {
        var siparisler = await _adminService.TumSiparisleriGetirAsync();
        return Ok(siparisler);
    }

    [HttpPut("siparis/{id}/durum")]
    public async Task<IActionResult> AnaSiparisDurumGuncelle(int id, [FromBody] SiparisDurumGuncelleDTO dto)
    {
        var sonuc = await _adminService.SiparisDurumGuncelleAsync(id, dto);
        if (!sonuc.Basarili) return BadRequest(sonuc.Mesaj);
        return Ok(sonuc.Mesaj);
    }
    
    // (Zorunlu İptaller için Admin'in detay güncelleme yetkisi)
    [HttpPut("siparis-detay/{id}/durum")]
    public async Task<IActionResult> AdminSiparisDetayDurumGuncelle(int id, [FromBody] SiparisDetayGuncelleDTO dto)
    {
        var sonuc = await _adminService.SiparisDetayDurumGuncelleAsync(id, dto);
        if (!sonuc.Basarili) return BadRequest(sonuc.Mesaj);
        return Ok(sonuc.Mesaj);
    }

    // --- ÜRÜN ONAY ENDPOINTLERİ ---

    [HttpGet("urunler/bekleyen")]
    public async Task<IActionResult> OnayBekleyenUrunleriGetir()
    {
        var urunler = await _adminService.OnayBekleyenUrunleriGetirAsync();
        return Ok(urunler);
    }

    [HttpPut("urun/{id}/onayla")]
    public async Task<IActionResult> UrunuOnayla(int id)
    {
        var sonuc = await _adminService.UrunuOnaylaAsync(id);
        if (!sonuc.Basarili) return BadRequest(sonuc.Mesaj);
        return Ok(sonuc.Mesaj);
    }

    [HttpDelete("urun/{id}/reddet")]
    public async Task<IActionResult> UrunuReddet(int id)
    {
        var sonuc = await _adminService.UrunuReddetAsync(id);
        if (!sonuc.Basarili) return BadRequest(sonuc.Mesaj);
        return Ok(sonuc.Mesaj);
    }
}