using ECommerceApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ECommerceApi.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class BildirimController : ControllerBase
{
    private readonly IBildirimService _bildirimService;
    public BildirimController(IBildirimService bildirimService) => _bildirimService = bildirimService;

    [HttpGet]
    public async Task<IActionResult> Getir()
    {
        int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var bildirimler = await _bildirimService.KullaniciBildirimleriniGetirAsync(userId);
        return Ok(bildirimler);
    }

    [HttpGet("okunmamis-sayisi")]
    public async Task<IActionResult> OkunmamisSayisiGetir()
    {
        int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var sayi = await _bildirimService.OkunmamisBildirimSayisiGetirAsync(userId);
        return Ok(new { okunmamisSayisi = sayi });
    }

    [HttpPut("okundu/{id}")]
    public async Task<IActionResult> OkunduIsaretle(int id)
    {
        int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _bildirimService.OkunduIsaretleAsync(id, userId);
        return Ok(new { mesaj = "Bildirim okundu." });
    }

    [HttpPut("tumunu-okundu")]
    public async Task<IActionResult> TumunuOkunduIsaretle()
    {
        int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _bildirimService.TumunuOkunduIsaretleAsync(userId);
        return Ok(new { mesaj = "Tüm bildirimler okundu." });
    }
}