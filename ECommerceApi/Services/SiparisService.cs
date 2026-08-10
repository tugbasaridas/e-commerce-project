using ECommerceApi.DataAccess;
using ECommerceApi.Entities;
using ECommerceApi.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

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
            bool adminKuponuMu = false;

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
                        adminKuponuMu = kupon.MagazaId == null;
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

                if (adminKuponuMu)
                {
                    saticiKazanci = hamSatirTutari - (hamSatirTutari * PLATFORM_KOMISYON_ORANI);
                    platformKomisyonu = (hamSatirTutari * PLATFORM_KOMISYON_ORANI) - indirilenTutar; 
                }
                else
                {
                    platformKomisyonu = netSatirTutari * PLATFORM_KOMISYON_ORANI; 
                    saticiKazanci = netSatirTutari - platformKomisyonu;            
                }

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
                Durum = "Hazırlanıyor",
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

    // ==========================================
    // 🌟 YENİ: İADE TALEBİ OLUŞTURMA METODU
    // ==========================================
   public async Task<(bool Basarili, string Mesaj)> IadeTalepEtAsync(int userId, IadeTalepDto dto)
    {
        var siparisDetay = await _db.Set<SiparisDetay>()
            .Include(sd => sd.Siparis)
            .Include(sd => sd.Urunler)
            .FirstOrDefaultAsync(sd => sd.Id == dto.SiparisDetayId && sd.Siparis!.KullaniciId == userId);

        if (siparisDetay == null)
            return (false, "Sipariş kalemi bulunamadı veya bu işlem için yetkiniz yok.");

        if (siparisDetay.Durum != "Tamamlandı" && siparisDetay.Durum != "Teslim Edildi")
            return (false, "Sadece 'Tamamlandı' veya 'Teslim Edildi' durumundaki ürünler için iade talebi oluşturabilirsiniz.");

        var mevcutTalep = await _db.Set<IadeTalebi>().AnyAsync(i => i.SiparisDetayId == dto.SiparisDetayId);
        if (mevcutTalep)
            return (false, "Bu ürün için zaten bir iade veya iptal talebiniz bulunuyor.");

        // Gerçek dünyada kargo firmasının API'sine istek atılıp barkod alınır. 
        // Biz burada profesyonel bir simülasyon (mock) yapıyoruz.
        string kargoKodu = "RET-" + new Random().Next(10000000, 99999999).ToString();

        var yeniIade = new IadeTalebi
        {
            KullaniciId = userId,
            SiparisDetayId = dto.SiparisDetayId,
            MagazaId = siparisDetay.Urunler!.MagazaId,
            IadeSebebi = dto.IadeSebebi,
            Durum = "İade Kodu Oluşturuldu",
            IadeKargoFirma = "Yurtiçi Kargo", // Örnek varsayılan firma
            IadeKargoKodu = kargoKodu,
            OlusturulmaTarihi = DateTime.UtcNow
        };

        _db.Set<IadeTalebi>().Add(yeniIade);
        siparisDetay.Durum = "İade Bekliyor";

        await _db.SaveChangesAsync();
        return (true, "İade talebiniz oluşturuldu. Kargo kodunuz üretildi.");
    }

    // ==========================================
    // 🌟 YENİ: İADE TALEPLERİMİ GETİRME METODU
    // ==========================================
    public async Task<object> IadeTaleplerimiGetirAsync(int userId)
    {
        return await _db.Set<IadeTalebi>()
            .Include(i => i.SiparisDetay)
                .ThenInclude(sd => sd!.Urunler)
            .Include(i => i.Magaza)
            .Where(i => i.KullaniciId == userId)
            .OrderByDescending(i => i.OlusturulmaTarihi)
            .Select(i => new {
                iadeId = i.Id,
                siparisId = i.SiparisDetay!.SiparisId,
                urunAdi = i.SiparisDetay.Urunler != null ? i.SiparisDetay.Urunler.Ad : "Silinmiş Ürün",
                resimUrl = i.SiparisDetay.Urunler != null ? i.SiparisDetay.Urunler.ResimUrl : "",
                magazaAdi = i.Magaza != null ? i.Magaza.MagazaAdi : "Bilinmiyor",
                iadeSebebi = i.IadeSebebi,
                durum = i.Durum,
                redSebebi = i.RedSebebi,
                kargoFirma = i.IadeKargoFirma,
                kargoKodu = i.IadeKargoKodu,
                tarih = i.OlusturulmaTarihi,
                iadeTutari = (i.SiparisDetay.BirimFiyat * i.SiparisDetay.Adet)
            })
            .ToListAsync();
    }
}