using ECommerceApi.DTOs;
using ECommerceApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ECommerceApi.Controllers;

[Authorize(Roles = "Kullanici")]
[ApiController]
[Route("api/[controller]")]
public class SiparislerController : ControllerBase
{
    private readonly ISiparisService _siparisService;

    public SiparislerController(ISiparisService siparisService)
    {
        _siparisService = siparisService;
    }

    [Authorize]
    [HttpPost("olustur")]
    public async Task<IActionResult> SiparisOlustur([FromBody] SiparisOlusturDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized();
        
        int userId = int.Parse(userIdClaim);

        var (basarili, mesaj, siparisId) = await _siparisService.SiparisOlusturAsync(userId, dto);

        if (!basarili)
            return BadRequest(new { Mesaj = mesaj });

        return Ok(new { Mesaj = mesaj, SiparisId = siparisId });
    }

    [Authorize]
    [HttpGet("gecmisim")]
    public async Task<IActionResult> SiparisGecmisimiGetir()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized();
        
        int userId = int.Parse(userIdClaim);

        var siparisler = await _siparisService.SiparisGecmisiniGetirAsync(userId);
        return Ok(siparisler);
    }

    // ==========================================
    // 🌟 YENİ: İADE TALEBİ OLUŞTURMA ENDPOINT'İ
    // ==========================================
    [Authorize]
    [HttpPost("iade-talep")]
    public async Task<IActionResult> IadeTalepEt([FromBody] IadeTalepDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized();
        
        int userId = int.Parse(userIdClaim);

        var (basarili, mesaj) = await _siparisService.IadeTalepEtAsync(userId, dto);

        if (!basarili)
            return BadRequest(new { Mesaj = mesaj });

        return Ok(new { Mesaj = mesaj });
    }

    // ==========================================
    // 🌟 YENİ: İADE TALEPLERİNİ GETİRME ENDPOINT'İ
    // ==========================================
    [Authorize]
    [HttpGet("iadelerim")]
    public async Task<IActionResult> IadelerimiGetir()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized();
        
        int userId = int.Parse(userIdClaim);

        var iadeler = await _siparisService.IadeTaleplerimiGetirAsync(userId);
        return Ok(iadeler);
    }
}