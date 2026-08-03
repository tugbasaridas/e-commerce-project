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
            decimal araToplam = sepetUrunleri.Sum(s => (s.Urunler!.IndirimliFiyat ?? s.Urunler.Fiyat) * s.Miktar);
            
            decimal indirimTutari = 0;
            int? gecerliKuponId = null;
            bool adminKuponuMu = false; // YENİ: Kuponun kimin olduğunu anlamak için bayrak

            if (dto.KuponId.HasValue)
            {
                var kupon = await _db.Kuponlar.FirstOrDefaultAsync(k => k.Id == dto.KuponId && k.AktifMi);
                
                if (kupon != null && (!kupon.BitisTarihi.HasValue || kupon.BitisTarihi.Value >= DateTime.UtcNow) && araToplam >= kupon.AltLimit)
                {
                    var cuzdanKaydi = await _db.KullaniciKuponlari
                        .FirstOrDefaultAsync(kk => kk.KuponId == kupon.Id && kk.KullaniciId == userId);

                    bool kullanmayaUygunMu = false;

                    if (cuzdanKaydi != null && !cuzdanKaydi.KullanildiMi)
                    {
                        kullanmayaUygunMu = true;
                        cuzdanKaydi.KullanildiMi = true; 
                    }
                    else if (cuzdanKaydi == null && kupon.HerkeseAcikMi)
                    {
                        kullanmayaUygunMu = true;
                        _db.KullaniciKuponlari.Add(new KullaniciKupon { KullaniciId = userId, KuponId = kupon.Id, KullanildiMi = true });
                    }

                    if (kullanmayaUygunMu)
                    {
                        if (!string.IsNullOrEmpty(kupon.IndirimTipi) && kupon.IndirimTipi.Equals("Yuzde", StringComparison.OrdinalIgnoreCase))
                        {
                            indirimTutari = (araToplam * kupon.IndirimDegeri) / 100;
                        }
                        else 
                        {
                            indirimTutari = kupon.IndirimDegeri > araToplam ? araToplam : kupon.IndirimDegeri;
                        }
                        
                        gecerliKuponId = kupon.Id;
                        adminKuponuMu = kupon.MagazaId == null; // YENİ: Eğer MağazaId null ise bu bir Admin kuponudur!
                    }
                }
            }

            decimal genelIndirimOrani = araToplam > 0 ? (indirimTutari / araToplam) : 0;
            
            decimal odenecekSonTutar = 0; 
            var siparisDetaylari = new List<SiparisDetay>();

            foreach (var sepetItem in sepetUrunleri)
            {
                var urun = sepetItem.Urunler;
                if (urun == null || !urun.AktifMi || !urun.AdminOnayliMi)
                    throw new Exception("Sepetinizdeki bazı ürünler artık satışa kapalıdır.");

                if (urun.Stok < sepetItem.Miktar)
                    throw new Exception($"'{urun.Ad}' için stok yetersiz! Stokta sadece {urun.Stok} adet kaldı.");

                decimal gecerliFiyat = urun.IndirimliFiyat ?? urun.Fiyat;
                decimal hamSatirTutari = gecerliFiyat * sepetItem.Miktar; 
                
                decimal indirilenTutar = hamSatirTutari * genelIndirimOrani;
                decimal netSatirTutari = hamSatirTutari - indirilenTutar; 

                decimal platformKomisyonu = 0;
                decimal saticiKazanci = 0;

                // ============================================================
                // YENİ FİNANSAL ZEKA: KUPON KİMİNSE PARAYI O ÖDER
                // ============================================================
                if (adminKuponuMu)
                {
                    // ADMİN KUPONU: Satıcı indirimi hissetmez, TAM FİYAT üzerinden parasını alır!
                    // İndirim, Admin'in cebinden (Platform Komisyonundan) düşülür.
                    saticiKazanci = hamSatirTutari - (hamSatirTutari * PLATFORM_KOMISYON_ORANI);
                    platformKomisyonu = (hamSatirTutari * PLATFORM_KOMISYON_ORANI) - indirilenTutar; 
                }
                else
                {
                    // SATICI KUPONU: Satıcı indirimli satış yapmış olur.
                    platformKomisyonu = netSatirTutari * PLATFORM_KOMISYON_ORANI; 
                    saticiKazanci = netSatirTutari - platformKomisyonu;           
                }
                // ============================================================

                odenecekSonTutar += netSatirTutari; 
                urun.Stok -= sepetItem.Miktar;

                siparisDetaylari.Add(new SiparisDetay
                {
                    UrunId = urun.Id,
                    Adet = sepetItem.Miktar,
                    BirimFiyat = gecerliFiyat,          
                    PlatformKomisyonu = platformKomisyonu, 
                    SaticiKazanci = saticiKazanci,      
                    Durum = "Hazırlanıyor"
                });
            }

            if (odenecekSonTutar < 0) odenecekSonTutar = 0;

            var yeniSiparis = new Siparis
            {
                KullaniciId = userId,
                ToplamTutar = odenecekSonTutar, 
                Durum = "Ödeme Alındı",
                SiparisTarihi = DateTime.UtcNow,
                OdemeYontemi = dto.OdemeYontemi,
                TeslimatAdresi = dto.TeslimatAdresi,
                Telefon = dto.Telefon,
                KuponId = gecerliKuponId,          
                IndirimTutari = indirimTutari,     
                Detaylar = siparisDetaylari
            };

            _db.Siparisler.Add(yeniSiparis);
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
            .Include(s => s.Kupon) 
            .Where(s => s.KullaniciId == userId)
            .OrderByDescending(s => s.SiparisTarihi)
            .Select(s => new
            {
                id = s.Id,
                siparisTarihi = s.SiparisTarihi,
                toplamTutar = s.ToplamTutar,
                durum = s.Durum,
                odemeYontemi = s.OdemeYontemi,
                teslimatAdresi = s.TeslimatAdresi,
                telefon = s.Telefon,
                kullanilanKuponKodu = s.Kupon != null ? s.Kupon.Kodu : null,
                kuponIndirimTutari = s.IndirimTutari ?? 0,
                urunler = s.Detaylar.Select(d => new
                {
                    detayId = d.Id,
                    urunId = d.UrunId,  
                    ad = d.Urunler != null ? d.Urunler.Ad : "Ürün Silinmiş",
                    resimUrl = d.Urunler != null ? d.Urunler.ResimUrl : "",
                    adet = d.Adet,
                    satinAlinanFiyat = d.BirimFiyat,
                    durum = d.Durum, 
                    kargoFirma = d.KargoFirma, 
                    kargoTakipNo = d.KargoTakipNo 
                }).ToList()
            })
            .ToListAsync();
    }
}