using ECommerceApi.DataAccess;
using ECommerceApi.DTOs;
using ECommerceApi.Entities;
using ECommerceApi.Services; 
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ECommerceApi.Services;

public class SaticiService : ISaticiService
{
    private readonly AppDbContext _context;
    private readonly IBildirimService _bildirimService; 

    public SaticiService(AppDbContext context, IBildirimService bildirimService)
    {
        _context = context;
        _bildirimService = bildirimService;
    }

    public async Task<bool> SaticiKayitAsync(MagazaBasvuruDto dto)
    {
        var emailVarMi = await _context.Kullanicilar.AnyAsync(k => k.Email == dto.Email);
        if (emailVarMi) throw new Exception("Bu e-posta adresi zaten kullanımda.");

        var yeniSatici = new Kullanicilar
        {
            AdSoyad = dto.AdSoyad,
            Email = dto.Email,
            SifreHash = BCrypt.Net.BCrypt.HashPassword(dto.Sifre),
            Rol = "Satici"
        };

        await _context.Kullanicilar.AddAsync(yeniSatici);
        await _context.SaveChangesAsync(); 

        var yeniMagaza = new Magaza
        {
            KullaniciId = yeniSatici.Id, 
            MagazaAdi = dto.MagazaAdi,
            VergiNo = dto.VergiNo,
            IletisimTelefonu = dto.IletisimTelefonu,
            OnaylandiMi = false 
        };

        await _context.Magazalar.AddAsync(yeniMagaza);
        await _context.SaveChangesAsync();

        return true;
    }

   public async Task<bool> UrunEkleAsync(int kullaniciId, SaticiUrunEkleDto dto)
    {
        var magaza = await _context.Magazalar.FirstOrDefaultAsync(m => m.KullaniciId == kullaniciId);
        
        if (magaza == null) 
            return false;

        var yeniUrun = new Urunler
        {
            Ad = dto.Ad,
            Aciklama = dto.Aciklama,
            Fiyat = dto.Fiyat,
            Stok = dto.Stok,
            ResimUrl = dto.ResimUrl,
            KategoriId = dto.KategoriId,
            
            MagazaId = magaza.Id,        
            AdminOnayliMi = false,      
            AktifMi = true              
        };

        _context.Urunler.Add(yeniUrun);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<List<Urunler>> KendiUrunlerimiGetirAsync(int kullaniciId)
    {
        var magaza = await _context.Magazalar
            .FirstOrDefaultAsync(m => m.KullaniciId == kullaniciId);

        if (magaza == null)
            throw new Exception("Mağaza bulunamadı.");

        return await _context.Urunler
            .Where(u => u.MagazaId == magaza.Id)
            .Include(u => u.Kategori) 
            .OrderByDescending(u => u.OlusturulmaTarihi)
            .ToListAsync();
    }

    // 🌟 GÜNCELLENDİ: FİYAT DÜŞÜŞÜNDE BİLDİRİM ATAN METOT
    public async Task<bool> UrunGuncelleAsync(int kullaniciId, int urunId, SaticiUrunGuncelleDto dto)
    {
        var magaza = await _context.Magazalar.FirstOrDefaultAsync(m => m.KullaniciId == kullaniciId);
        if (magaza == null) throw new Exception("Mağaza bulunamadı.");

        var urun = await _context.Urunler
            .FirstOrDefaultAsync(u => u.Id == urunId && u.MagazaId == magaza.Id);

        if (urun == null)
            throw new Exception("Ürün bulunamadı veya bu ürün sizin mağazanıza ait değil.");

        // Fiyatı güncellemeden önce eski fiyatı kenara not alıyoruz
        decimal eskiFiyat = urun.Fiyat;

        urun.Ad = dto.Ad;
        urun.Aciklama = dto.Aciklama;
        urun.Fiyat = dto.Fiyat;
        urun.Stok = dto.Stok;
        urun.KategoriId = dto.KategoriId; 
        urun.ResimUrl = dto.ResimUrl;

        await _context.SaveChangesAsync();

        // 🌟 FİYAT DÜŞÜŞ KONTROLÜ VE FAVORİ BİLDİRİMİ
        if (dto.Fiyat < eskiFiyat)
        {
            try
            {
                var favorileyenler = await _context.Favoriler
                    .Where(f => f.UrunId == urun.Id)
                    .Select(f => f.KullaniciId)
                    .ToListAsync();

                foreach (var musteriId in favorileyenler)
                {
                    await _bildirimService.BildirimGonderAsync(
                        musteriId,
                        "🔥 Favori Ürününün Fiyatı Düştü!",
                        $"Takip ettiğin '{urun.Ad}' ürününün fiyatı {eskiFiyat} ₺'den {dto.Fiyat} ₺'ye indi. Tükenmeden incele!",
                        "Indirim",
                        $"/detay?id={urun.Id}" 
                    );
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Fiyat düşüş bildirimi gönderilemedi: " + ex.Message);
            }
        }

        return true;
    }

    public async Task<bool> UrunSilAsync(int kullaniciId, int urunId)
    {
        var magaza = await _context.Magazalar.FirstOrDefaultAsync(m => m.KullaniciId == kullaniciId);
        if (magaza == null) throw new Exception("Mağaza bulunamadı.");

        var urun = await _context.Urunler.FirstOrDefaultAsync(u => u.Id == urunId && u.MagazaId == magaza.Id);
        if (urun == null) throw new Exception("Ürün bulunamadı veya bu ürünü silme yetkiniz yok.");

        _context.Urunler.Remove(urun);
        await _context.SaveChangesAsync();
        return true;
    }

    // --- İNDİRİM METOTLARI ---
    
    // 🌟 GÜNCELLENDİ: AKILLI İNDİRİM BİLDİRİM SİSTEMİ
    public async Task<(bool Basarili, string Mesaj)> IndirimYapAsync(int kullaniciId, int urunId, decimal yeniFiyat, int saat)
    {
        var magaza = await _context.Magazalar.FirstOrDefaultAsync(m => m.KullaniciId == kullaniciId);
        if (magaza == null) return (false, "Mağaza bulunamadı.");

        var urun = await _context.Urunler.FirstOrDefaultAsync(u => u.Id == urunId && u.MagazaId == magaza.Id);
        if (urun == null) return (false, "Ürün bulunamadı veya bu ürüne indirim yapma yetkiniz yok.");

        if (yeniFiyat >= urun.Fiyat) 
            return (false, "İndirimli fiyat, asıl liste fiyatından daha düşük olmalıdır!");

        urun.IndirimliFiyat = yeniFiyat;
        urun.IndirimBitisTarihi = DateTime.UtcNow.AddHours(saat);
        
        await _context.SaveChangesAsync();

        // =========================================================================
        // 🌟 BİLDİRİM SİSTEMİ (Takipçiler + Favorileyenler Aynı Kişiye Çift Gitmez)
        // =========================================================================
        try
        {
            var takipciIdleri = await _context.Takipciler
                .Where(t => t.MagazaId == magaza.Id)
                .Select(t => t.KullaniciId)
                .ToListAsync();

            var favorileyenIdleri = await _context.Favoriler
                .Where(f => f.UrunId == urun.Id)
                .Select(f => f.KullaniciId)
                .ToListAsync();

            var bildirilecekMusteriler = takipciIdleri.Union(favorileyenIdleri).Distinct().ToList();

            foreach (var musteriId in bildirilecekMusteriler)
            {
                await _bildirimService.BildirimGonderAsync(
                    musteriId,
                    "🔥 İndirim Alarmı!",
                    $"{magaza.MagazaAdi} mağazası '{urun.Ad}' ürününde {yeniFiyat} ₺'ye düşen bir indirim yaptı. Fırsatı kaçırma!",
                    "Indirim",
                    $"/detay?id={urun.Id}"
                );
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("İndirim bildirimi gönderilemedi: " + ex.Message);
        }
        // =========================================================================

        return (true, $"İndirim başarıyla {saat} saat boyunca uygulandı.");
    }

    public async Task<(bool Basarili, string Mesaj)> IndirimiKaldirAsync(int kullaniciId, int urunId)
    {
        var magaza = await _context.Magazalar.FirstOrDefaultAsync(m => m.KullaniciId == kullaniciId);
        if (magaza == null) return (false, "Mağaza bulunamadı.");

        var urun = await _context.Urunler.FirstOrDefaultAsync(u => u.Id == urunId && u.MagazaId == magaza.Id);
        if (urun == null) return (false, "Ürün bulunamadı veya bu ürün size ait değil.");

        if (urun.IndirimliFiyat != null || urun.IndirimBitisTarihi != null)
        {
            urun.IndirimliFiyat = null; 
            urun.IndirimBitisTarihi = null; 
            
            await _context.SaveChangesAsync();
            return (true, "İndirim başarıyla kaldırıldı ve fiyat eski haline döndü.");
        }

        return (false, "Bu ürün zaten indirimde değil.");
    }

    // --- SİPARİŞ METOTLARI ---

    public async Task<object> KendiMagazamdakiSiparisleriGetirAsync(int kullaniciId)
    {
        var magaza = await _context.Magazalar.FirstOrDefaultAsync(m => m.KullaniciId == kullaniciId);
        if (magaza == null) throw new Exception("Mağaza bulunamadı.");

        var hamSiparisler = await _context.Siparisler
            .Include(s => s.Kupon) 
            .Include(s => s.Detaylar)
                .ThenInclude(d => d.Urunler)
            .Where(s => s.Detaylar!.Any(d => d.Urunler != null && d.Urunler.MagazaId == magaza.Id)) 
            .Join(_context.Kullanicilar,
                  s => s.KullaniciId,
                  k => k.Id,
                  (s, k) => new { Siparis = s, Kullanici = k })
            .OrderByDescending(x => x.Siparis.SiparisTarihi)
            .ToListAsync();

        var sonuc = hamSiparisler.Select(x => 
        {
            decimal iptalOlanKendiTutari = x.Siparis.Detaylar!
                .Where(d => d.Urunler != null && d.Urunler.MagazaId == magaza.Id && (d.Durum == "İptal" || d.Durum == "İptal Edildi"))
                .Sum(d => d.Adet * d.BirimFiyat);
                
            decimal hamKendiToplami = x.Siparis.Detaylar!
                .Where(d => d.Urunler != null && d.Urunler.MagazaId == magaza.Id)
                .Sum(d => d.Adet * d.BirimFiyat);

            decimal gecerliOran = hamKendiToplami > 0 ? (hamKendiToplami - iptalOlanKendiTutari) / hamKendiToplami : 0;
            decimal netMusteriOdemesi = hamKendiToplami * gecerliOran;

            var satilanKendiUrunleri = x.Siparis.Detaylar!
                .Where(d => d.Urunler != null && d.Urunler.MagazaId == magaza.Id)
                .Select(d => new
                {
                    DetayId = d.Id, 
                    UrunId = d.UrunId,
                    Ad = d.Urunler != null ? d.Urunler.Ad : "Silinmiş Ürün",
                    Adet = d.Adet,
                    BirimFiyat = d.BirimFiyat,
                    SaticiKazanci = (d.Durum == "İptal" || d.Durum == "İptal Edildi") ? 0 : d.SaticiKazanci,
                    ResimUrl = d.Urunler != null ? d.Urunler.ResimUrl : "",
                    Durum = d.Durum, 
                    KargoFirma = d.KargoFirma, 
                    KargoTakipNo = d.KargoTakipNo 
                }).ToList();

            decimal netSaticiKazanci = satilanKendiUrunleri.Sum(u => u.SaticiKazanci);

            return new
            {
                SiparisId = x.Siparis.Id,
                SiparisTarihi = x.Siparis.SiparisTarihi,
                Durum = x.Siparis.Durum,
                MusteriAd = x.Kullanici != null ? x.Kullanici.AdSoyad : "Bilinmiyor", 
                TeslimatAdresi = x.Siparis.TeslimatAdresi,
                IletisimTelfonu = x.Siparis.Telefon,
                OdemeYontemi = x.Siparis.OdemeYontemi,
                
                ToplamTutar = Math.Round(netMusteriOdemesi, 2),
                
                KullanilanKuponKodu = x.Siparis.Kupon != null ? x.Siparis.Kupon.Kodu : null,
                KuponIndirimTutari = x.Siparis.IndirimTutari ?? 0,
                
                SaticiKazanci = Math.Round(netSaticiKazanci, 2), 
                SatilanUrunler = satilanKendiUrunleri
            };
        }).ToList();

        return sonuc;
    }
    
    public async Task<(bool Basarili, string Mesaj)> SiparisDetayDurumGuncelleAsync(int kullaniciId, int detayId, SiparisDetayGuncelleDTO dto)
    {
        var magaza = await _context.Magazalar.FirstOrDefaultAsync(m => m.KullaniciId == kullaniciId);
        if (magaza == null) return (false, "Mağaza bulunamadı.");

        var detay = await _context.Set<SiparisDetay>()
            .Include(d => d.Urunler)
            .Include(d => d.Siparis)
                .ThenInclude(s => s!.Detaylar)
            .FirstOrDefaultAsync(d => d.Id == detayId);

        if (detay == null) return (false, "Sipariş kalemi bulunamadı.");
            
        if (detay.Urunler == null || detay.Urunler!.MagazaId != magaza!.Id)
            return (false, "Bu sipariş kalemi sizin mağazanıza ait değil!");

        detay.Durum = dto.YeniDurum;
        
        if (dto.YeniDurum == "Kargoya Verildi")
        {
            detay.KargoFirma = dto.KargoFirma;
            detay.KargoTakipNo = dto.KargoTakipNo;
        }

        var siparis = detay.Siparis; 
        
        if (siparis != null && siparis.Detaylar != null)
        {
            var tumDurumlar = siparis.Detaylar.Where(x => x != null).Select(d => d!.Durum ?? "").ToList();

            if (tumDurumlar.All(d => d == "İptal Edildi" || d == "İptal"))
            {
                siparis.Durum = "İptal Edildi";
            }
            else if (tumDurumlar.All(d => d == "Tamamlandı" || d == "İptal Edildi" || d == "İptal"))
            {
                siparis.Durum = "Tamamlandı";
            }
            else if (tumDurumlar.All(d => d == "Kargoya Verildi" || d == "Tamamlandı" || d == "İptal Edildi" || d == "İptal"))
            {
                siparis.Durum = "Kargoya Verildi";
            }
            else
            {
                siparis.Durum = "Hazırlanıyor";
            }
        }

        await _context.SaveChangesAsync();

        if (siparis != null)
        {
            if (dto.YeniDurum == "Kargoya Verildi")
            {
                await _bildirimService.BildirimGonderAsync(
                    siparis.KullaniciId,
                    "🚚 Siparişiniz Kargoya Verildi",
                    $"#{siparis.Id} numaralı siparişiniz kargo firmasına teslim edilmiştir.",
                    "Siparis",
                    "/siparislerim"
                );
            }
            else if (dto.YeniDurum == "Tamamlandı")
            {
                await _bildirimService.BildirimGonderAsync(
                    siparis.KullaniciId,
                    "✅ Siparişiniz Teslim Edildi",
                    $"#{siparis.Id} numaralı siparişiniz başarıyla tamamlandı. Bizi tercih ettiğiniz için teşekkür ederiz!",
                    "Siparis",
                    "/siparislerim"
                );
            }
        }

        return (true, "Sipariş kalemi başarıyla güncellendi.");
    }
}