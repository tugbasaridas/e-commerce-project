using ECommerceApi.DataAccess;
using ECommerceApi.DTOs;
using Microsoft.EntityFrameworkCore;

namespace ECommerceApi.Services;

public class AdminService : IAdminService
{
    private readonly AppDbContext _db;

    public AdminService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<object> GetDashboardIstatistikleriAsync()
    {
        var toplamUrun = await _db.Urunler.CountAsync();
        var toplamKullanici = await _db.Kullanicilar.CountAsync();
        var beklemedeOlanSiparisler = await _db.Siparisler.CountAsync(s => s.Durum == "Hazırlanıyor");

        return new
        {
            ToplamUrun = toplamUrun,
            ToplamKullanici = toplamKullanici,
            BekleyenSiparisler = beklemedeOlanSiparisler
        };
    }

    public async Task<object> TumSiparisleriGetirAsync()
    {
        return await _db.Siparisler
            .Include(s => s.Detaylar)
                .ThenInclude(d => d.Urunler)
            .Join(_db.Kullanicilar,
                  s => s.KullaniciId,
                  k => k.Id,
                  (s, k) => new { Siparis = s, Kullanici = k })
            .OrderByDescending(x => x.Siparis.SiparisTarihi)
            .Select(x => new
            {
                Id = x.Siparis.Id,
                SiparisTarihi = x.Siparis.SiparisTarihi,
                ToplamTutar = x.Siparis.ToplamTutar,
                Durum = x.Siparis.Durum,
                
                OdemeYontemi = x.Siparis.OdemeYontemi,
                TeslimatAdresi = x.Siparis.TeslimatAdresi,
                Telefon = x.Siparis.Telefon, // <-- DÜZELTME: Telefon verisi artık frontend'e gidiyor!
                
                KullaniciId = x.Siparis.KullaniciId, 
                KullaniciAdSoyad = x.Kullanici.AdSoyad,
                KullaniciEmail = x.Kullanici.Email,
                Urunler = x.Siparis.Detaylar.Select(d => new
                {
                    Ad = d.Urunler != null ? d.Urunler.Ad : "Silinmiş Ürün",
                    Adet = d.Adet,
                    BirimFiyat = d.BirimFiyat
                })
            })
            .ToListAsync();
    }

    public async Task<(bool Basarili, string Mesaj, string? YeniDurum)> SiparisDurumGuncelleAsync(int id, SiparisDurumGuncelleDTO dto)
    {
        var siparis = await _db.Siparisler.FindAsync(id);
        if (siparis == null) return (false, "Sipariş bulunamadı.", null);

        siparis.Durum = dto.YeniDurum;
        await _db.SaveChangesAsync();

        return (true, "Sipariş durumu başarıyla güncellendi.", siparis.Durum);
    }
}