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

        var urunler = await _context.Urunler
            .Where(u => u.MagazaId == magaza.Id)
            .Include(u => u.Kategori) 
            .OrderByDescending(u => u.OlusturulmaTarihi)
            .ToListAsync();

        // ========================================================================
        // 🌟 AKILLI İNDİRİM KONTROLÜ (LAZY EXPIRATION)
        // Süresi dolan indirimleri tespit edip anında sistemden siliyoruz
        // ========================================================================
        bool degisiklikYapildi = false;
        var suAn = DateTime.UtcNow;

        foreach (var urun in urunler)
        {
            if (urun.IndirimliFiyat.HasValue && urun.IndirimBitisTarihi.HasValue && urun.IndirimBitisTarihi.Value <= suAn)
            {
                urun.IndirimliFiyat = null; // Fiyatı aslına döndür
                urun.IndirimBitisTarihi = null; // Sayacı sıfırla
                degisiklikYapildi = true;
            }
        }

        // Eğer süresi dolan ürünler bulup düzelttiysek, veritabanına kaydet
        if (degisiklikYapildi)
        {
            await _context.SaveChangesAsync();
        }
        // ========================================================================

        return urunler;
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
            // 🌟 ÇÖZÜM 1: "İade Edildi" durumunu satıcının brüt cirosundan düşüyoruz
            decimal iptalVeIadeOlanKendiTutari = x.Siparis.Detaylar!
                .Where(d => d.Urunler != null && d.Urunler.MagazaId == magaza.Id && (d.Durum == "İptal" || d.Durum == "İptal Edildi" || d.Durum == "İade Edildi"))
                .Sum(d => d.Adet * d.BirimFiyat);
                
            decimal hamKendiToplami = x.Siparis.Detaylar!
                .Where(d => d.Urunler != null && d.Urunler.MagazaId == magaza.Id)
                .Sum(d => d.Adet * d.BirimFiyat);

            decimal gecerliOran = hamKendiToplami > 0 ? (hamKendiToplami - iptalVeIadeOlanKendiTutari) / hamKendiToplami : 0;
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
                    
                    // 🌟 ÇÖZÜM 2: Satıcının detaylı listesinde de iade edilen ürünün net kazancını "0" gösteriyoruz
                    SaticiKazanci = (d.Durum == "İptal" || d.Durum == "İptal Edildi" || d.Durum == "İade Edildi") ? 0 : d.SaticiKazanci,
                    
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

        // 🌟 1. KORUMA: Kilitli statülerde değişiklik yapılamaz!
        if (detay.Durum == "İptal" || detay.Durum == "İptal Edildi" || detay.Durum == "İade Edildi")
        {
            return (false, $"Bu ürün '{detay.Durum}' statüsünde olduğu için kilitlenmiştir ve üzerinde değişiklik yapılamaz.");
        }

        // 🌟 2. KORUMA: Müşteri iade/iptal talebi açtıysa satıcı siparişi kurcalayamaz!
        bool iadeTalebiVarMi = await _context.Set<IadeTalebi>().AnyAsync(i => i.SiparisDetayId == detayId);
        if (iadeTalebiVarMi)
        {
            return (false, "Bu ürün için aktif bir iade talebi bulunuyor. Sipariş durumuna müdahale edemezsiniz.");
        }

        // 🌟 3. KORUMA: Durum Makinesi - Adım atlama yasak!
        if (detay.Durum == "Hazırlanıyor")
        {
            if (dto.YeniDurum != "Kargoya Verildi" && dto.YeniDurum != "İptal" && dto.YeniDurum != "İptal Edildi")
                return (false, "Hazırlanıyor aşamasındaki bir sipariş doğrudan Tamamlandı yapılamaz! Önce 'Kargoya Verildi' olarak işaretlemelisiniz.");
        }
        else if (detay.Durum == "Kargoya Verildi")
        {
            if (dto.YeniDurum != "Tamamlandı" && dto.YeniDurum != "Teslim Edildi" && dto.YeniDurum != "İptal" && dto.YeniDurum != "İptal Edildi")
                return (false, "Kargoya verilmiş bir sipariş sadece 'Tamamlandı' veya 'İptal Edildi' statüsüne alınabilir.");
        }
        else if (detay.Durum == "Tamamlandı" || detay.Durum == "Teslim Edildi")
        {
            if (dto.YeniDurum != "İade Edildi")
                return (false, "Tamamlanmış siparişlere yalnızca iade süreçleri için müdahale edilebilir.");
        }

        // Tüm güvenlik testlerinden geçildiyse durumu güncelle
        detay.Durum = dto.YeniDurum;
        
        if (dto.YeniDurum == "Kargoya Verildi")
        {
            detay.KargoFirma = dto.KargoFirma;
            detay.KargoTakipNo = dto.KargoTakipNo;
        }

        // =========================================================================
        // 🌟 4. KORUMA: Akıllı Ana Sipariş Durumu (Görseldeki Bug'ın Çözümü)
        // =========================================================================
        var siparis = detay.Siparis; 
        if (siparis != null && siparis.Detaylar != null)
        {
            var tumDurumlar = siparis.Detaylar.Select(d => d.Durum ?? "").ToList();
            
            // İptal ve İade edilenleri yok sayıp sadece 'geçerli' ürünleri listele
            var gecerliDurumlar = tumDurumlar.Where(d => d != "İptal" && d != "İptal Edildi" && d != "İade Edildi" && d != "İade Bekliyor").ToList();

            if (gecerliDurumlar.Count == 0)
            {
                // Sepette geçerli hiçbir ürün kalmadı (Hepsi iptal veya iade).
                bool iadeVarMi = tumDurumlar.Any(d => d == "İade Edildi" || d == "İade Bekliyor");
                siparis.Durum = iadeVarMi ? "İade Edildi" : "İptal Edildi";
            }
            else if (gecerliDurumlar.Any(d => d == "Hazırlanıyor"))
            {
                // İçeride 1 tane bile "Hazırlanıyor" varsa, paket hala hazırlanıyordur.
                siparis.Durum = "Hazırlanıyor";
            }
            else if (gecerliDurumlar.Any(d => d == "Kargoya Verildi"))
            {
                // Hazırlanan kalmadıysa ama "Kargoya Verildi" varsa, paket yoldadır.
                siparis.Durum = "Kargoya Verildi";
            }
            else if (gecerliDurumlar.All(d => d == "Tamamlandı" || d == "Teslim Edildi"))
            {
                // Geriye kalan tüm geçerli ürünler tamamlandıysa, ana sipariş de BİTMİŞTİR!
                siparis.Durum = "Tamamlandı";
            }
        }
        // =========================================================================

        await _context.SaveChangesAsync();

        // Bildirim Gönderimleri
        if (siparis != null)
        {
            try 
            {
                if (dto.YeniDurum == "Kargoya Verildi")
                {
                    await _bildirimService.BildirimGonderAsync(
                        siparis.KullaniciId, "🚚 Siparişiniz Kargoya Verildi", $"#{siparis.Id} numaralı siparişiniz kargoya verilmiştir.", "Siparis", "/siparislerim");
                }
                else if (dto.YeniDurum == "Tamamlandı" || dto.YeniDurum == "Teslim Edildi")
                {
                    await _bildirimService.BildirimGonderAsync(
                        siparis.KullaniciId, "✅ Siparişiniz Teslim Edildi", $"#{siparis.Id} numaralı siparişinizdeki bir ürün teslim edilmiştir.", "Siparis", "/siparislerim");
                }
                else if (dto.YeniDurum == "İptal Edildi" || dto.YeniDurum == "İptal")
                {
                    await _bildirimService.BildirimGonderAsync(
                        siparis.KullaniciId, "❌ Sipariş İptali", $"#{siparis.Id} numaralı siparişinizdeki ürün iptal edilmiştir.", "Siparis", "/siparislerim");
                }
            } 
            catch { /* Bildirim hatası yoksayılır */ }
        }

        return (true, "Sipariş durumu kurallara uygun şekilde başarıyla güncellendi.");
    }
    public async Task<object> SaticiProfilBilgisiGetirAsync(int kullaniciId)
    {
        var kullanici = await _context.Kullanicilar.FindAsync(kullaniciId);
        var magaza = await _context.Magazalar.FirstOrDefaultAsync(m => m.KullaniciId == kullaniciId);

        return new {
            saticiAdSoyad = kullanici?.AdSoyad ?? "Satıcı",
            magazaAdi = magaza?.MagazaAdi ?? "Mağazam"
        };
    }
    public async Task<object> SaticiIadeTalepleriniGetirAsync(int kullaniciId)
    {
        var magaza = await _context.Magazalar.FirstOrDefaultAsync(m => m.KullaniciId == kullaniciId);
        if (magaza == null) throw new Exception("Mağaza bulunamadı.");

        return await _context.Set<IadeTalebi>()
            .Include(i => i.SiparisDetay)
                .ThenInclude(sd => sd!.Urunler)
            .Include(i => i.Kullanici)
            .Where(i => i.MagazaId == magaza.Id)
            .OrderByDescending(i => i.OlusturulmaTarihi)
            .Select(i => new {
                iadeId = i.Id,
                siparisId = i.SiparisDetay!.SiparisId,
                urunAdi = i.SiparisDetay.Urunler != null ? i.SiparisDetay.Urunler.Ad : "Ürün Silinmiş",
                resimUrl = i.SiparisDetay.Urunler != null ? i.SiparisDetay.Urunler.ResimUrl : "",
                musteriAdi = i.Kullanici != null ? i.Kullanici.AdSoyad : "Bilinmiyor",
                iadeSebebi = i.IadeSebebi,
                durum = i.Durum,
                redSebebi = i.RedSebebi,
                tarih = i.OlusturulmaTarihi,
                kargoFirma = i.IadeKargoFirma,
                kargoKodu = i.IadeKargoKodu,
                iadeTutari = (i.SiparisDetay.BirimFiyat * i.SiparisDetay.Adet)
            })
            .ToListAsync();
    }


    public async Task<(bool Basarili, string Mesaj)> SaticiIadeDurumGuncelleAsync(int kullaniciId, IadeDurumGuncelleDto dto)
    {
        // 1. Önce giriş yapan kullanıcının mağazasını buluyoruz
        var magaza = await _context.Magazalar.FirstOrDefaultAsync(m => m.KullaniciId == kullaniciId);
        if (magaza == null)
            return (false, "Mağaza bulunamadı.");

        var iade = await _context.Set<IadeTalebi>()
            .Include(i => i.SiparisDetay)
                .ThenInclude(sd => sd!.Siparis)       
                    .ThenInclude(s => s!.Detaylar)    
            .FirstOrDefaultAsync(i => i.Id == dto.IadeId && i.MagazaId == magaza.Id);

        if (iade == null)
            return (false, "İade talebi bulunamadı veya bu işlem için yetkiniz yok.");

        // State Machine (Durum Makinesi) Kuralları
        if (dto.Islem == "TeslimAl")
        {
            if (iade.Durum != "İade Kodu Oluşturuldu")
                return (false, "Bu ürün henüz yola çıkmamış veya zaten teslim alınmış.");
            
            iade.Durum = "İncelemede";
        }
        else if (dto.Islem == "Onayla")
        {
            if (iade.Durum != "İncelemede")
                return (false, "İadeyi onaylamak için önce ürünü 'Teslim Al'manız ve incelemeniz gerekmektedir.");
            
            iade.Durum = "Onaylandı";
            
            if (iade.SiparisDetay != null) 
            {
                // Ürün iade edildiği için kazançları sıfırlıyoruz 
                iade.SiparisDetay.Durum = "İade Edildi";
                iade.SiparisDetay.SaticiKazanci = 0;
                iade.SiparisDetay.PlatformKomisyonu = 0;

                //  Eğer sepetteki geçerli olan her şey iade edildiyse, ana siparişi de İade Edildi yap
                var siparis = iade.SiparisDetay.Siparis;
                if (siparis != null && siparis.Detaylar != null)
                {
                    // İptal ve İade edilenler dışındaki aktif ürünlere bakıyoruz
                    var gecerliDurumlar = siparis.Detaylar.Where(d => d.Durum != "İptal" && d.Durum != "İptal Edildi" && d.Durum != "İade Edildi").ToList();
                    
                    // Geçerli  ürün kalmadıysa, demek ki hepsi iptal veya iade olmuş
                    if (gecerliDurumlar.Count == 0) 
                    {
                        siparis.Durum = "İade Edildi";
                    }
                }
            }

            // Müşteriye bilgi veriyoruz
            try 
            {
                await _bildirimService.BildirimGonderAsync(
                    iade.KullaniciId, 
                    "✅ İadeniz Onaylandı", 
                    "İade ettiğiniz ürün satıcı tarafından onaylandı ve ilgili tutarın iade süreci başlatıldı.", 
                    "Iade", 
                    "/iade-taleplerim"
                );
            }
            catch { /* Hata fırlatmasını engelliyoruz */ }
        }
        else if (dto.Islem == "Reddet")
        {
            if (iade.Durum != "İncelemede")
                return (false, "İadeyi reddetmek için önce ürünü 'Teslim Al'manız ve incelemeniz gerekmektedir.");
            
            if (string.IsNullOrWhiteSpace(dto.RedSebebi))
                return (false, "Reddetme işlemi için mutlaka bir sebep girmelisiniz.");

            iade.Durum = "Reddedildi";
            iade.RedSebebi = dto.RedSebebi;
            
            if (iade.SiparisDetay != null) 
            {
                // Reddedilince eski haline (Tamamlandı) geri döner
                iade.SiparisDetay.Durum = "Tamamlandı"; 
            }
        }
        else
        {
            return (false, "Geçersiz bir işlem türü gönderildi.");
        }

        await _context.SaveChangesAsync();
        return (true, $"İade işlemi başarıyla gerçekleştirildi. Yeni durum: {iade.Durum}");
    }
}