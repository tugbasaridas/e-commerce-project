using ECommerceApi.Entities;
using ECommerceApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceApi.Controllers;

[ApiController]
[Route("api/[controller]")] 
public class KategorilerController : ControllerBase
{
    private readonly IKategoriService _kategoriService;

    public KategorilerController(IKategoriService kategoriService)
    {
        _kategoriService = kategoriService;
    }

    [HttpGet]
    public async Task<IActionResult> GetKategoriler()
    {
        var kategoriler = await _kategoriService.GetKategorilerAsync();
        return Ok(kategoriler);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> KategoriEkle([FromBody] Kategori yeniKategori)
    {
        var eklenenKategori = await _kategoriService.KategoriEkleAsync(yeniKategori);
        return Ok(eklenenKategori);
    }


    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> KategoriSil(int id)
    {
        // DİKKAT: Burada dönen değeri (basarili, mesaj) şeklinde ikiye ayırarak karşılıyoruz
        var (basarili, mesaj) = await _kategoriService.KategoriSilAsync(id);
        
        if (!basarili) 
        {
            if (mesaj == "Kategori bulunamadı.") 
                return NotFound(new { Mesaj = mesaj });
                
            return BadRequest(new { Mesaj = mesaj });
        }
        
        return Ok(new { Mesaj = mesaj });
    }
}