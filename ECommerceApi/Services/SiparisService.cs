using ECommerceApi.DataAccess;
using ECommerceApi.Entities;
using ECommerceApi.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ECommerceApi.Services;

public class SiparisService : ISiparisService
{
    private readonly AppDbContext _db;
    private readonly ILogger<SiparisService> _logger;

    // Sabit komisyon oranımızı %10 olarak belirliyoruz
    private const decimal PLATFORM_KOMISYON_ORANI = 0.10m; 

    public SiparisService(AppDbContext db, ILogger<SiparisService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<(bool Basarili, string Mesaj, int? SiparisId)> SiparisOlusturAsync(int userId, SiparisOlusturDto dto)
    {
        var sepetUrunleri = await _db.SepetUrunleri
            .Include(k => k.Urunler)
            .Where(k => k.KullaniciId == userId)
            .ToListAsync();

        if (!sepetUrunleri.Any())
            return (false, "Sepetiniz boş, sipariş oluşturulamaz.", null);

        using var transaction = await _db.Database.BeginTransactionAsync();

        try
        {
            decimal toplamTutar = 0;
            var siparisDetaylari = new List<SiparisDetay>();

            foreach (var sepetItem in sepetUrunleri)
            {
                var urun = sepetItem.Urunler;
                if (urun == null || !urun.AktifMi || !urun.AdminOnayliMi)
                    throw new Exception("Sepetinizdeki bazı ürünler artık satışa kapalıdır.");

                if (urun.Stok < sepetItem.Miktar)
                    throw new Exception($"'{urun.Ad}' için stok yetersiz! Stokta sadece {urun.Stok} adet kaldı.");

                decimal gecerliFiyat = urun.IndirimliFiyat ?? urun.Fiyat;
                decimal satirTutari = gecerliFiyat * sepetItem.Miktar;
                
                // TRENDYOL ALGORİTMASI: Komisyon ve Kazanç Hesaplama
                decimal komisyonTutari = satirTutari * PLATFORM_KOMISYON_ORANI;
                decimal saticiKazanci = satirTutari - komisyonTutari;

                toplamTutar += satirTutari;
                
                // Stok Düşme
                urun.Stok -= sepetItem.Miktar;

                siparisDetaylari.Add(new SiparisDetay
                {
                    UrunId = urun.Id,
                    Adet = sepetItem.Miktar,
                    BirimFiyat = gecerliFiyat,
                    PlatformKomisyonu = komisyonTutari, 
                    SaticiKazanci = saticiKazanci,     
                    Durum = "Hazırlanıyor"
                });
            }

            var yeniSiparis = new Siparis
            {
                KullaniciId = userId,
                ToplamTutar = toplamTutar,
                Durum = "Hazırlanıyor",
                SiparisTarihi = DateTime.UtcNow,
                OdemeYontemi = dto.OdemeYontemi,
                TeslimatAdresi = dto.TeslimatAdresi,
                Telefon = dto.Telefon,
                Detaylar = siparisDetaylari
            };

            _db.Siparisler.Add(yeniSiparis);
            
            // Sipariş oluştuktan sonra müşterinin sepetini temizle
            _db.SepetUrunleri.RemoveRange(sepetUrunleri);

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return (true, "Siparişiniz başarıyla oluşturuldu.", yeniSiparis.Id);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Sipariş hatası. Kullanıcı: {UserId}", userId);
            return (false, ex.Message, null);
        }
    }

   public async Task<object> SiparisGecmisiniGetirAsync(int userId)
    {
        return await _db.Siparisler
            .Where(s => s.KullaniciId == userId)
            .OrderByDescending(s => s.SiparisTarihi)
            .Select(s => new
            {
                s.Id,
                s.SiparisTarihi,
                s.ToplamTutar,
                s.Durum,
                s.OdemeYontemi,
                s.TeslimatAdresi,
                s.Telefon,
                Urunler = s.Detaylar.Select(d => new
                {
                    DetayId = d.Id,
                    UrunId = d.UrunId,  
                    Ad = d.Urunler != null ? d.Urunler.Ad : "Ürün Silinmiş",
                    ResimUrl = d.Urunler != null ? d.Urunler.ResimUrl : "",
                    Adet = d.Adet,
                    SatinAlinanFiyat = d.BirimFiyat,
                    Durum = d.Durum, 
                    KargoFirma = d.KargoFirma, 
                    KargoTakipNo = d.KargoTakipNo 
                })
            })
            .ToListAsync();
    }
}