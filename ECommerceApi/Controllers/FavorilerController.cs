using ECommerceApi.DTOs;
using ECommerceApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ECommerceApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")] // Bu otomatik olarak "api/favoriler" yolunu oluşturur
public class FavorilerController : ControllerBase
{
    private readonly IFavoriService _favoriService;

    public FavorilerController(IFavoriService favoriService)
    {
        _favoriService = favoriService;
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim!);
    }

    [HttpPost]
    public async Task<IActionResult> FavoriEkle([FromBody] FavoriEkleDTO dto)
    {
        var (basarili, mesaj) = await _favoriService.FavoriEkleAsync(GetUserId(), dto);
        if (!basarili) return BadRequest(new { Mesaj = mesaj });

        return Ok(new { Mesaj = mesaj });
    }

    [HttpGet]
    public async Task<IActionResult> FavorileriGetir()
    {
        var favoriler = await _favoriService.FavorileriGetirAsync(GetUserId());
        return Ok(favoriler);
    }

    [HttpDelete("{urunId}")]
    public async Task<IActionResult> FavoriSil(int urunId)
    {
        var (basarili, mesaj) = await _favoriService.FavoriSilAsync(GetUserId(), urunId);
        if (!basarili) return NotFound(new { Mesaj = mesaj });

        return Ok(new { Mesaj = mesaj });
    }
}