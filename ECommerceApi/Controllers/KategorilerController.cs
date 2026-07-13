using ECommerceApi.Entities;
using ECommerceApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceApi.Controllers;

[ApiController]
[Route("api/[controller]")] // "api/kategoriler" yolunu otomatik oluşturur
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

    [HttpPost]
    public async Task<IActionResult> KategoriEkle([FromBody] Kategori yeniKategori)
    {
        var eklenenKategori = await _kategoriService.KategoriEkleAsync(yeniKategori);
        return Ok(eklenenKategori);
    }
}