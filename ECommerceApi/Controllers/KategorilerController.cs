using ECommerceApi.DTOs;
using ECommerceApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceApi.Controllers;

[ApiController]
[Route("api/[controller]")] 
public class KategoriController : ControllerBase
{
    private readonly IKategoriService _kategoriService;

    public KategoriController(IKategoriService kategoriService)
    {
        _kategoriService = kategoriService;
    }

    [HttpGet]
    [AllowAnonymous] 
    public async Task<IActionResult> GetKategoriler()
    {
        var kategoriler = await _kategoriService.GetKategorilerAsync();
        return Ok(kategoriler);
    }

    [HttpGet("tumu")]
    [AllowAnonymous]
    public async Task<IActionResult> GetTumKategorilerDuz()
    {
        var kategoriler = await _kategoriService.GetTumKategorilerDuzAsync();
        return Ok(kategoriler);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> KategoriEkle([FromBody] KategoriEkledto dto)
    {
        var (basarili, mesaj) = await _kategoriService.KategoriEkleAsync(dto);
        if (!basarili) return BadRequest(new { Mesaj = mesaj });

        return Ok(new { Mesaj = mesaj });
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> KategoriSil(int id)
    {
        var (basarili, mesaj) = await _kategoriService.KategoriSilAsync(id);
        if (!basarili) return BadRequest(new { Mesaj = mesaj });
        
        return Ok(new { Mesaj = mesaj });
    }
}