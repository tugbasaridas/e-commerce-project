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

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
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
}