using ECommerceApi.DTOs;
using ECommerceApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceApi.Controllers;

[Authorize(Roles = "Admin")] 
[ApiController]
[Route("api/[controller]")] 
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly IUrunService _urunService;

    public AdminController(IAdminService adminService,IUrunService urunService)
    {
        _adminService = adminService;
        _urunService = urunService;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var istatistikler = await _adminService.GetDashboardIstatistikleriAsync();
        return Ok(istatistikler);
    }

    [HttpGet("siparisler")]
    public async Task<IActionResult> GetTumSiparisler()
    {
        var siparisler = await _adminService.TumSiparisleriGetirAsync();
        return Ok(siparisler);
    }

    [HttpPut("siparisler/{id}/durum")]
    public async Task<IActionResult> SiparisDurumGuncelle(int id, [FromBody] SiparisDurumGuncelleDTO dto)
    {
        var (basarili, mesaj, yeniDurum) = await _adminService.SiparisDurumGuncelleAsync(id, dto);
        
        if (!basarili) return NotFound(new { Mesaj = mesaj });

        return Ok(new { Mesaj = mesaj, YeniDurum = yeniDurum });
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("sil/{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var sonuc = await _adminService.KullaniciSilAsync(id);
        if (!sonuc.Basarili) return BadRequest(sonuc.Mesaj);
        return Ok(new { Mesaj = sonuc.Mesaj });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("aktiflestir/{id}")]
    public async Task<IActionResult> ActivateUser(int id)
    {
        var sonuc = await _adminService.KullaniciAktiflestirAsync(id);
        if (!sonuc.Basarili) return BadRequest(sonuc.Mesaj);
        return Ok(new { Mesaj = sonuc.Mesaj });
    }

    // --- YENİ EKLENEN İNDİRİM METOTLARI ---
    [HttpPost("urunler/{id}/indirim-yap")]
    public async Task<IActionResult> IndirimYap(int id, [FromBody] IndirimDTO dto)
    {
        var sonuc = await _urunService.IndirimYapAsync(id, dto.YeniFiyat);
        if (!sonuc.Basarili) return BadRequest(new { Mesaj = sonuc.Mesaj });
        return Ok(new { Mesaj = sonuc.Mesaj });
    }

    [HttpPost("urunler/{id}/indirim-kaldir")]
    public async Task<IActionResult> IndirimiKaldir(int id)
    {
        var sonuc = await _urunService.IndirimiKaldirAsync(id);
        if (!sonuc.Basarili) return BadRequest(new { Mesaj = sonuc.Mesaj });
        return Ok(new { Mesaj = sonuc.Mesaj });
    }

    
}