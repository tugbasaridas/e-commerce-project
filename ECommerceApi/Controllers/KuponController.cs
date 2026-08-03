using ECommerceApi.DataAccess;
using ECommerceApi.DTOs;
using ECommerceApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ECommerceApi.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize] 
public class KuponController : ControllerBase
{
    private readonly IKuponService _kuponService;
    private readonly AppDbContext _context;

    public KuponController(IKuponService kuponService, AppDbContext context) 
    {
        _kuponService = kuponService;
        _context = context;
    }

    // =======================================================
    // 1. MÜŞTERİ (KULLANICI) İŞLEMLERİ
    // =======================================================

    [HttpPost("takip-et/{magazaId}")]
    [Authorize(Roles = "Kullanici")]
    public async Task<IActionResult> MagazaTakipEt(int magazaId)
    {
        int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var sonuc = await _kuponService.MagazaTakipEtVeKuponKazanAsync(userId, magazaId);
        
        if (!sonuc.Basarili) return BadRequest(new { mesaj = sonuc.Mesaj });
        
        return Ok(new { mesaj = sonuc.Mesaj, kuponKodu = sonuc.KuponKodu });
    }

    [HttpGet("cuzdanim")]
    [Authorize(Roles = "Kullanici")]
    public async Task<IActionResult> CuzdanimiGetir()
    {
        int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var kuponlar = await _kuponService.KullaniciKuponlariniGetirAsync(userId);
        return Ok(kuponlar);
    }

    [HttpPost("uygula")]
    [Authorize(Roles = "Kullanici")]
    public async Task<IActionResult> KuponUygula([FromBody] KuponUygulaDto dto)
    {
        int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        
        // KRİTİK GÜNCELLEME: Eski metot yerine yeni KuponUygulaDetayliAsync metodunu ve SepetUrunleri'ni çağırıyoruz
        var sonuc = await _kuponService.KuponUygulaDetayliAsync(userId, dto.KuponKodu, dto.SepetToplami, dto.SepetUrunleri);
        
        if (!sonuc.Basarili) return BadRequest(new { mesaj = sonuc.Mesaj });

        return Ok(new { mesaj = sonuc.Mesaj, indirimTutari = sonuc.IndirimTutari, kuponId = sonuc.KuponId });
    }
    // =======================================================
    // 2. ORTAK YÖNETİM İŞLEMLERİ (ADMİN & SATICI)
    // =======================================================

    [HttpPost("yonetim/olustur")]
    [Authorize(Roles = "Admin,Satici")]
    public async Task<IActionResult> YonetimKuponOlustur([FromBody] KuponOlusturDto dto)
    {
        var rol = User.FindFirstValue(ClaimTypes.Role);
        int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        int? magazaId = null;

        if (rol == "Satici")
        {
            var magaza = await _context.Magazalar.FirstOrDefaultAsync(m => m.KullaniciId == userId);
            if (magaza == null) return BadRequest(new { mesaj = "Mağazanız bulunamadı." });
            magazaId = magaza.Id;
        }

        // KRİTİK GÜNCELLEME: Satıcının seçtiği ürünlerin ID listesini (dto.SecilenUrunIds) servise gönderiyoruz
        var sonuc = await _kuponService.KuponOlusturAsync(dto, rol!, magazaId, dto.SecilenUrunIds);
        
        if (!sonuc.Basarili) return BadRequest(new { mesaj = sonuc.Mesaj });
        return Ok(new { mesaj = sonuc.Mesaj });
    }

    [HttpGet("yonetim/listele")]
    [Authorize(Roles = "Admin,Satici")]
    public async Task<IActionResult> YonetimKuponListele()
    {
        var rol = User.FindFirstValue(ClaimTypes.Role);
        int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var liste = await _kuponService.YoneticiKuponlariniGetirAsync(userId, rol!);
        return Ok(liste);
    }

    [HttpDelete("yonetim/sil/{id}")]
    [Authorize(Roles = "Admin,Satici")]
    public async Task<IActionResult> YonetimKuponSil(int id)
    {
        var rol = User.FindFirstValue(ClaimTypes.Role);
        int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var sonuc = await _kuponService.KuponSilAsync(id, userId, rol!);
        
        if (!sonuc.Basarili) return BadRequest(new { mesaj = sonuc.Mesaj });
        return Ok(new { mesaj = sonuc.Mesaj });
    }

    // =======================================================
    // 3. SADECE ADMİN'E ÖZEL İŞLEMLER
    // =======================================================

    [HttpPost("yonetim/tanimla")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> KullanicilaraKuponTanimla([FromBody] KuponTanimlaDto dto)
    {
        // Admin, seçtiği spesifik kullanıcılara (telafi vs.) kupon tanımlar
        var sonuc = await _kuponService.KullanicilaraKuponTanimlaAsync(dto.KuponId, dto.KullaniciIdleri);
        
        if (!sonuc.Basarili) return BadRequest(new { mesaj = sonuc.Mesaj });

        return Ok(new { mesaj = sonuc.Mesaj });
    }

    // =======================================================
    // 4. SADECE SATICIYA ÖZEL İŞLEMLER
    // =======================================================

    [HttpPost("yonetim/takipcilere-gonder/{kuponId}")]
    [Authorize(Roles = "Satici")]
    public async Task<IActionResult> TakipcilereKuponGonder(int kuponId)
    {
        int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        
        // 1. Satıcının mağazasını bul
        var magaza = await _context.Magazalar.FirstOrDefaultAsync(m => m.KullaniciId == userId);
        if (magaza == null) return BadRequest(new { mesaj = "Mağazanız bulunamadı." });

        // 2. Bu mağazayı takip eden KULLANICI ID'lerini listele
        var takipciIdleri = await _context.Takipciler
            .Where(t => t.MagazaId == magaza.Id)
            .Select(t => t.KullaniciId)
            .ToListAsync();

        if (!takipciIdleri.Any())
            return BadRequest(new { mesaj = "Henüz takipçiniz bulunmuyor." });

        // 3. Kupon servisini kullanarak takipçilere kuponu tanımla
        var sonuc = await _kuponService.KullanicilaraKuponTanimlaAsync(kuponId, takipciIdleri);

        if (!sonuc.Basarili) return BadRequest(new { mesaj = sonuc.Mesaj });

        return Ok(new { mesaj = $"Kupon {takipciIdleri.Count} takipçinize başarıyla hediye edildi!" });
    }

   // 1. TAKİBİ BIRAK ENDPOINT'İ (Kuponu da silen GÜNCELLENMİŞ hali)
    [HttpDelete("takibi-birak/{magazaId}")]
    [Authorize(Roles = "Kullanici")]
    public async Task<IActionResult> TakibiBirak(int magazaId)
    {
        int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        
        var takipKaydi = await _context.Takipciler
            .FirstOrDefaultAsync(t => t.KullaniciId == userId && t.MagazaId == magazaId);

        if (takipKaydi == null)
            return BadRequest(new { mesaj = "Zaten bu mağazayı takip etmiyorsunuz." });

        // 1. Takip kaydını veritabanından kaldır
        _context.Takipciler.Remove(takipKaydi);

        // 2. Bu mağazadan kazanılmış, henüz KULLANILMAMIŞ ve SADECE TAKİPÇİLERE ÖZEL (VIP) olan kuponları cüzdandan sil
        var kullanilmamisVipKuponlar = await _context.KullaniciKuponlari
            .Include(kk => kk.Kupon)
            .Where(kk => kk.KullaniciId == userId && 
                         kk.Kupon!.MagazaId == magazaId && 
                         !kk.KullanildiMi && 
                         !kk.Kupon.HerkeseAcikMi) // YENİ: Sadece VIP olanları (Herkese açık olmayanları) siler
            .ToListAsync(); 

        if (kullanilmamisVipKuponlar.Any())
        {
            _context.KullaniciKuponlari.RemoveRange(kullanilmamisVipKuponlar);
        }

        await _context.SaveChangesAsync();

        return Ok(new { mesaj = "Mağaza takipten çıkarıldı ve size özel tanımlanan VIP kuponlar iptal edildi." });
    }

   // 2. MAĞAZA DETAY, ÜRÜNLERİ VE KUPONLARI ENDPOINT'İ
    [HttpGet("detay/{magazaId}")]
    [AllowAnonymous]
    public async Task<IActionResult> MagazaDetayGetir(int magazaId)
    {
        var magaza = await _context.Magazalar
            .Include(m => m.Kullanici)
            .FirstOrDefaultAsync(m => m.Id == magazaId);

        if (magaza == null) return NotFound(new { mesaj = "Mağaza bulunamadı." });

        // Mağazanın ürünleri
        var urunler = await _context.Urunler
            .Where(u => u.MagazaId == magazaId && u.AktifMi && u.AdminOnayliMi)
            .ToListAsync();

        // Mağazanın aktif kuponları (Vitrin kuponları)
        var kuponlar = await _context.Kuponlar
            .Where(k => k.MagazaId == magazaId && k.AktifMi)
            .ToListAsync();

        return Ok(new
        {
            magazaId = magaza.Id,
            magazaAdi = magaza.MagazaAdi,
            urunler,
            kuponlar
        });
    }
    // 3. MAĞAZA TAKİP DURUMUNU KONTROL ETME ENDPOINT'İ
    [HttpGet("takip-durumu/{magazaId}")]
    [Authorize(Roles = "Kullanici")]
    public async Task<IActionResult> TakipDurumuGetir(int magazaId)
    {
        int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        
        bool takipEdiyorMu = await _context.Takipciler
            .AnyAsync(t => t.KullaniciId == userId && t.MagazaId == magazaId);

        return Ok(new { takipEdiliyor = takipEdiyorMu });
    }

    [HttpGet("urun/{urunId}")]
    [AllowAnonymous] // Herkes görebilmeli
    public async Task<IActionResult> UrununKuponlariniGetir(int urunId)
    {
        try
        {
            var kuponlar = await _kuponService.UrununKuponlariniGetirAsync(urunId);
            return Ok(kuponlar);
        }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }

    
}