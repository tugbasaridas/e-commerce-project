using ECommerceApi.DTOs;
using ECommerceApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ECommerceApi.Controllers;

[Authorize] 
[ApiController]
[Route("api/sepet")] 
public class SepetController : ControllerBase
{
    private readonly IKartService _kartService;

    public SepetController(IKartService kartService)
    {
        _kartService = kartService;
    }

    
    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim!);
    }

    [HttpGet]
    public async Task<IActionResult> GetSepet()
    {
        var sepetListesi = await _kartService.SepetiGetirAsync(GetUserId());
        return Ok(sepetListesi);
    }

    [HttpPost]
    public async Task<IActionResult> SepeteEkle([FromBody] SepeteEkleDTO dto)
    {
        var (basarili, mesaj) = await _kartService.SepeteEkleAsync(GetUserId(), dto);
        return Ok(new { Mesaj = mesaj });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> SepettenSil(int id)
    {
        var (basarili, mesaj) = await _kartService.SepettenSilAsync(GetUserId(), id);
        if (!basarili) return NotFound(new { Mesaj = mesaj });
        
        return Ok(new { Mesaj = mesaj });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> MiktarGuncelle(int id, [FromBody] MiktarGuncelleDTO dto)
    {
        var (basarili, mesaj) = await _kartService.MiktarGuncelleAsync(GetUserId(), id, dto);
        if (!basarili) return NotFound(new { Mesaj = mesaj });
        
        return Ok(new { Mesaj = mesaj });
    }
}