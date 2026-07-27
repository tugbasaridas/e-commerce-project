using ECommerceApi.DTOs;
using ECommerceApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace ECommerceApi.Controllers;

[ApiController]
[Route("api/[controller]")] 
public class DestekController : ControllerBase
{
    private readonly IDestekService _destekService;

    public DestekController(IDestekService destekService)
    {
        _destekService = destekService;
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value 
                          ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim!);
    }

    // YENİ: Hem Müşteri Hem Satıcı destek talebi açabilir
    [Authorize(Roles = "Kullanici,Satici,Satıcı")] 
    [HttpPost]
    public async Task<IActionResult> YeniMesajGonder([FromBody] DestekTalebiDTO dto)
    {
        var (basarili, mesaj) = await _destekService.YeniTalepOlusturAsync(GetUserId(), dto);
        return Ok(new { Mesaj = mesaj });
    }

    [Authorize(Roles = "Kullanici,Satici,Satıcı")]
    [HttpGet("kullanici")]
    public async Task<IActionResult> KullaniciTalepleriniGetir()
    {
        var talepler = await _destekService.KullaniciTalepleriniGetirAsync(GetUserId());
        return Ok(talepler);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("admin")]
    public async Task<IActionResult> TumTalepleriGetirAdmin()
    {
        var talepler = await _destekService.TumTalepleriGetirAdminAsync();
        return Ok(talepler);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("cevapla/{id}")]
    public async Task<IActionResult> Cevapla(int id, [FromBody] DestekCevapDTO dto)
    {
        var (basarili, mesaj) = await _destekService.TalebiCevaplaAsync(id, dto);
        if (!basarili) return NotFound(new { Mesaj = mesaj });

        return Ok(new { Mesaj = mesaj });
    }
}