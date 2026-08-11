using ECommerceApi.DataAccess;
using ECommerceApi.Entities;
using ECommerceApi.DTOs;
using Microsoft.EntityFrameworkCore;

namespace ECommerceApi.Services;

public class AdminService : IAdminService
{
    private readonly AppDbContext _db;
    private readonly IBildirimService _bildirimService; 

    public AdminService(AppDbContext db, IBildirimService bildirimService)
    {
        _db = db;
        _bildirimService = bildirimService;
    }

   public async Task<object> GetDashboardIstatistikleriAsync()
    {
        // 1. AKTİF ÜRÜN
        var aktifUrunSayisi = await _db.Urunler
            .Include(u => u.Magaza)
            .ThenInclude(m => m.Kullanici)
            .CountAsync(u => u.AktifMi == true 
                          && u.AdminOnayliMi == true 
                          && u.Magaza != null
                          && u.Magaza.OnaylandiMi == true 
                          && u.Magaza.Kullanici.IsDeleted == false);
        
        // 2. PASİF ÜRÜN
        var pasifUrunSayisi = await _db.Urunler
            .Include(u => u.Magaza)
            .ThenInclude(m => m.Kullanici)
            .CountAsync(u => u.AktifMi == false 
                          || u.AdminOnayliMi == false 
                          || u.Magaza == null
                          || u.Magaza.OnaylandiMi == false 
                          || u.Magaza.Kullanici.IsDeleted == true);

        // 3. MÜŞTERİ
        var toplamMusteri = await _db.Kullanicilar
            .Where(k => k.IsDeleted == false) 
            .CountAsync(k => k.Rol != "Admin" && k.Rol != "Satici" && k.Rol != "Satıcı");
            
        // 4. SATICI
        var toplamSatici = await _db.Magazalar
            .Include(m => m.Kullanici)
            .Where(m => m.Kullanici.IsDeleted == false) 
            .CountAsync(m => m.OnaylandiMi == true);

        // --- BİLDİRİM (BADGE) SAYILARI ---
        var bekleyenSiparisler = await _db.Siparisler.CountAsync(s => s.Durum == "Hazırlanıyor");
        var bekleyenMagazaSayisi = await _db.Magazalar.CountAsync(m => m.OnaylandiMi == false);
        var bekleyenUrunSayisi = await _db.Urunler.CountAsync(u => u.AdminOnayliMi == false);
        var bekleyenDestekSayisi = await _db.DestekTalepleri.CountAsync(d => d.Durum == "Bekliyor");

        // --- PAZARLAMA VE CİRO ANALİTİĞİ ---
        var simdikiYil = DateTime.UtcNow.Year;
        var simdikiAy = DateTime.UtcNow.Month;

        var basariliSiparisler = await _db.Siparisler
            .Include(s => s.Detaylar!)
                .ThenInclude(d => d.Urunler)
                    .ThenInclude(u => u!.Magaza)
            .Where(s => s.Durum == "Tamamlandı" || s.Durum == "Teslim Edildi")
            .ToListAsync(); 

        // 🌟 YENİ: İptal ve İade edilen ürünleri cirodan net bir şekilde düşüren hesaplama aracı
        var netCiroHesapla = (Siparis s) => {
            decimal iptalVeIadeTutari = s.Detaylar!
                .Where(d => d.Durum == "İptal" || d.Durum == "İptal Edildi" || d.Durum == "İade Edildi")
                .Sum(d => d.Adet * d.BirimFiyat);
                
            decimal hamToplam = s.Detaylar!.Sum(d => d.Adet * d.BirimFiyat);
            decimal gecerliOran = hamToplam > 0 ? (hamToplam - iptalVeIadeTutari) / hamToplam : 0;
            return s.ToplamTutar * gecerliOran;
        };

        // 🌟 DÜZELTİLDİ: Net Ciro üzerinden toplamı buluyoruz
        var toplamCiro = Math.Round(basariliSiparisler.Sum(s => netCiroHesapla(s)), 2);
        var platformKazanci = Math.Round(toplamCiro * 0.10m, 2);
        var basariliSiparisSayisi = basariliSiparisler.Count;

        var aylikCiro = Math.Round(basariliSiparisler
            .Where(s => s.SiparisTarihi.Year == simdikiYil && s.SiparisTarihi.Month == simdikiAy)
            .Sum(s => netCiroHesapla(s)), 2);

        // 🌟 DÜZELTİLDİ: En çok satanlarda İptal ve İade edilen ürünler sayılmaz
        var enCokSatanlar = basariliSiparisler
            .SelectMany(s => s.Detaylar!) 
            .Where(d => d.Durum != "İptal" && d.Durum != "İptal Edildi" && d.Durum != "İade Edildi")
            .GroupBy(d => new { 
                d.UrunId, 
                UrunAdi = d.Urunler != null ? d.Urunler.Ad : "Silinmiş Ürün",
                ResimUrl = (d.Urunler != null && !string.IsNullOrEmpty(d.Urunler.ResimUrl)) 
                            ? d.Urunler.ResimUrl 
                            : "https://via.placeholder.com/150",
                MagazaAdi = d.Urunler != null && d.Urunler.Magaza != null ? d.Urunler.Magaza.MagazaAdi : "Bilinmiyor"
            }) 
            .Select(g => new 
            {
                UrunId = g.Key.UrunId,
                UrunAdi = g.Key.UrunAdi,
                ResimUrl = g.Key.ResimUrl,
                MagazaAdi = g.Key.MagazaAdi,
                ToplamSatisAdedi = g.Sum(x => x.Adet),
                ToplamKazanc = Math.Round(g.Sum(x => x.Adet * x.BirimFiyat), 2)
            })
            .OrderByDescending(x => x.ToplamSatisAdedi) 
            .Take(5) 
            .ToList();

        return new
        {
            AktifUrun = aktifUrunSayisi,
            PasifUrun = pasifUrunSayisi,
            ToplamMusteri = toplamMusteri,
            ToplamSatici = toplamSatici,
            ToplamCiro = toplamCiro,
            PlatformKazanci = platformKazanci,  
            AylikCiro = aylikCiro,
            BasariliSiparisSayisi = basariliSiparisSayisi,
            EnCokSatanlar = enCokSatanlar,
            
            bekleyenSiparis = bekleyenSiparisler,
            bekleyenMagaza = bekleyenMagazaSayisi,
            bekleyenUrun = bekleyenUrunSayisi,
            bekleyenDestek = bekleyenDestekSayisi
        };
    }
    
    public async Task<object> TumSiparisleriGetirAsync()
    {
        var siparisler = await _db.Siparisler
            .Include(s => s.Kupon) 
            .Include(s => s.Detaylar)
                .ThenInclude(d => d.Urunler)
                    .ThenInclude(u => u!.Magaza)
            .Join(_db.Kullanicilar,
                s => s.KullaniciId,
                k => k.Id,
                (s, k) => new { Siparis = s, Kullanici = k })
            .OrderByDescending(x => x.Siparis.SiparisTarihi)
            .ToListAsync(); 

        return siparisler.Select(x => 
        {
            // 🌟 DÜZELTİLDİ: İade Edildi durumunu da cirodan düşme mantığına ekledik
            decimal iptalOlanTutar = x.Siparis.Detaylar!
                .Where(d => d.Durum == "İptal" || d.Durum == "İptal Edildi" || d.Durum == "İade Edildi")
                .Sum(d => d.Adet * d.BirimFiyat);
                
            decimal hamToplam = x.Siparis.Detaylar!.Sum(d => d.Adet * d.BirimFiyat);
            decimal gecerliOran = hamToplam > 0 ? (hamToplam - iptalOlanTutar) / hamToplam : 0;
            decimal netGecerliTutar = x.Siparis.ToplamTutar * gecerliOran;

            return new
            {
                Id = x.Siparis.Id,
                SiparisTarihi = x.Siparis.SiparisTarihi,
                ToplamTutar = Math.Round(netGecerliTutar, 2),
                Durum = x.Siparis.Durum,
                OdemeYontemi = x.Siparis.OdemeYontemi,
                TeslimatAdresi = x.Siparis.TeslimatAdresi,
                Telefon = x.Siparis.Telefon,
                KullaniciId = x.Siparis.KullaniciId,
                KullaniciAdSoyad = x.Kullanici.AdSoyad,
                KullaniciEmail = x.Kullanici.Email,
                
                KullanilanKuponKodu = x.Siparis.Kupon != null ? x.Siparis.Kupon.Kodu : null,
                KuponIndirimTutari = x.Siparis.IndirimTutari ?? 0,

                AdminKazanci = Math.Round(netGecerliTutar * 0.10m, 2),
                SaticiKazanci = Math.Round(netGecerliTutar * 0.90m, 2),

                Urunler = x.Siparis.Detaylar!.Select(d => new
                {
                    DetayId = d.Id,
                    UrunId = d.UrunId,
                    Ad = d.Urunler != null ? d.Urunler.Ad : "Silinmiş Ürün",
                    ResimUrl = d.Urunler != null ? d.Urunler.ResimUrl : null,
                    MagazaAdi = d.Urunler != null && d.Urunler.Magaza != null ? d.Urunler.Magaza.MagazaAdi : "Bilinmiyor",
                    Adet = d.Adet,
                    BirimFiyat = Math.Round(d.BirimFiyat, 2),
                    Durum = d.Durum,
                    KargoFirma = d.KargoFirma,
                    KargoTakipNo = d.KargoTakipNo
                }).ToList()
            };
        }).ToList();
    }

    public async Task<(bool Basarili, string Mesaj)> SiparisDetayDurumGuncelleAsync(int detayId, SiparisDetayGuncelleDTO dto)
    {
        var detay = await _db.Set<SiparisDetay>()
            .Include(d => d.Siparis)
                .ThenInclude(s => s!.Detaylar)
            .FirstOrDefaultAsync(d => d.Id == detayId);

        if (detay == null) return (false, "Sipariş detayı (ürün) bulunamadı.");

        detay.Durum = dto.YeniDurum;

        if (dto.YeniDurum == "Kargoya Verildi")
        {
            detay.KargoFirma = dto.KargoFirma;
            detay.KargoTakipNo = dto.KargoTakipNo;
        }

        // --- YENİ: İPTALLER HARİÇ AKILLI SİPARİŞ DURUMU ---
        var siparis = detay.Siparis; 
        
        if (siparis != null && siparis.Detaylar != null)
        {
            var tumDurumlar = siparis.Detaylar.Select(d => d.Durum ?? "").ToList();
            
            // 🌟 DÜZELTİLDİ: "İade Edildi" durumu da ana siparişin genel durumunu olumsuz etkilememeli
            var gecerliDurumlar = tumDurumlar.Where(d => d != "İptal" && d != "İptal Edildi" && d != "İade Edildi").ToList();

            if (gecerliDurumlar.Count == 0)
            {
                // 1. KURAL: Bütün ürünler iptal/iade edilmişse
                siparis.Durum = "İptal Edildi";
            }
            else if (gecerliDurumlar.Any(d => d == "Hazırlanıyor"))
            {
                // 2. KURAL: İptaller hariç ürünlerde 1 tane bile Hazırlanan varsa
                siparis.Durum = "Hazırlanıyor";
            }
            else if (gecerliDurumlar.Any(d => d == "Kargoya Verildi"))
            {
                // 3. KURAL: Hazırlanan kalmadıysa ve Kargoya verilen varsa
                siparis.Durum = "Kargoya Verildi";
            }
            else if (gecerliDurumlar.All(d => d == "Tamamlandı" || d == "Teslim Edildi"))
            {
                // 4. KURAL: İptaller hariç geriye kalan hepsi Tamamlanmışsa
                siparis.Durum = "Tamamlandı";
            }
            else 
            {
                siparis.Durum = "Hazırlanıyor";
            }
        }

        await _db.SaveChangesAsync();

        // =========================================================================
        // 🌟 YENİ: ADMİN İŞLEM YAPTIĞINDA MÜŞTERİYE BİLDİRİM GİTSİN
        // =========================================================================
        if (siparis != null)
        {
            if (dto.YeniDurum == "Kargoya Verildi")
            {
                await _bildirimService.BildirimGonderAsync(
                    siparis.KullaniciId,
                    "🚚 Siparişiniz Kargoya Verildi",
                    $"#{siparis.Id} numaralı siparişinizdeki bir ürün kargoya verilmiştir.",
                    "Siparis",
                    "/siparislerim"
                );
            }
            else if (dto.YeniDurum == "Tamamlandı" || dto.YeniDurum == "Teslim Edildi")
            {
                await _bildirimService.BildirimGonderAsync(
                    siparis.KullaniciId,
                    "✅ Siparişiniz Teslim Edildi",
                    $"#{siparis.Id} numaralı siparişinizdeki bir ürün teslim edilmiştir.",
                    "Siparis",
                    "/siparislerim"
                );
            }
            else if (dto.YeniDurum == "İptal Edildi" || dto.YeniDurum == "İptal")
            {
                await _bildirimService.BildirimGonderAsync(
                    siparis.KullaniciId,
                    "❌ Sipariş İptali",
                    $"#{siparis.Id} numaralı siparişinizdeki bir ürün iptal edilmiştir. İlgili tutar iade edilecektir.",
                    "Siparis",
                    "/siparislerim"
                );
            }
        }
        // =========================================================================

        return (true, "Ürünün kargo durumu başarıyla güncellendi.");
    }

    public async Task<(bool Basarili, string Mesaj, string? YeniDurum)> SiparisDurumGuncelleAsync(int id, SiparisDurumGuncelleDTO dto)
    {
        var siparis = await _db.Siparisler.FindAsync(id);
        if (siparis == null) return (false, "Sipariş bulunamadı.", null);

        siparis.Durum = dto.YeniDurum;
        await _db.SaveChangesAsync();

        return (true, "Sipariş durumu başarıyla güncellendi.", siparis.Durum);
    }

    public async Task<(bool Basarili, string Mesaj)> KullaniciSilAsync(int userId)
    {
        var kullanici = await _db.Kullanicilar
            .IgnoreQueryFilters() 
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (kullanici == null) return (false, "Kullanıcı bulunamadı.");
        
        if (kullanici.Rol == "Admin") 
        {
            return (false, "Kritik Hata: Sistem yöneticisi hesabı askıya alınamaz!");
        }

        // 1. Kullanıcıyı askıya al
        kullanici.IsDeleted = true;
        kullanici.DeletedAt = DateTime.UtcNow;

        // 2. Eğer bu kullanıcı bir satıcıysa, mağazasını ve ürünlerini de PASİFE ÇEK
        var magaza = await _db.Magazalar.FirstOrDefaultAsync(m => m.KullaniciId == userId);
        if (magaza != null)
        {
            var saticininUrunleri = await _db.Urunler.Where(u => u.MagazaId == magaza.Id).ToListAsync();
            foreach (var urun in saticininUrunleri)
            {
                urun.AktifMi = false;
            }
        }

        try 
        {
            await _db.SaveChangesAsync();
            return (true, "Kullanıcı başarıyla askıya alındı ve ürünleri pasifleştirildi.");
        }
        catch (Exception)
        {
            return (false, "Silme işlemi sırasında bir hata oluştu.");
        }
    }

   public async Task<(bool Basarili, string Mesaj)> KullaniciAktiflestirAsync(int userId)
    {
        var kullanici = await _db.Kullanicilar.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == userId);
        if (kullanici == null) return (false, "Kullanıcı bulunamadı.");

        kullanici.IsDeleted = false; // Pasif durumdan çıkar
        kullanici.DeletedAt = null;

        var magaza = await _db.Magazalar.FirstOrDefaultAsync(m => m.KullaniciId == userId);
        if (magaza != null)
        {
            var saticininUrunleri = await _db.Urunler.Where(u => u.MagazaId == magaza.Id).ToListAsync();
            foreach (var urun in saticininUrunleri)
            {
                urun.AktifMi = true; 
            }
        }

        await _db.SaveChangesAsync();
        return (true, "Kullanıcı başarıyla aktifleştirildi ve ürünleri tekrar yayına alındı.");
    }

    public async Task<object> BekleyenMagazalariGetirAsync()
    {
        return await _db.Magazalar
            .Include(m => m.Kullanici)
            .Where(m => m.OnaylandiMi == false)
            .Select(m => new 
            {
                MagazaId = m.Id,
                m.MagazaAdi,
                m.VergiNo,
                m.IletisimTelefonu,
                SaticiAdi = m.Kullanici.AdSoyad,
                SaticiEmail = m.Kullanici.Email
            })
            .ToListAsync();
    }

    public async Task<bool> MagazaOnaylaAsync(int magazaId)
    {
        var magaza = await _db.Magazalar.FirstOrDefaultAsync(m => m.Id == magazaId);
        if (magaza == null) 
            throw new Exception("Mağaza bulunamadı.");

        if (magaza.OnaylandiMi) 
            throw new Exception("Bu mağaza zaten onaylanmış.");

        magaza.OnaylandiMi = true;
        await _db.SaveChangesAsync();

        return true;
    }

    public async Task<object> TumMagazalariGetirAsync()
    {
        return await _db.Magazalar
            .Include(m => m.Kullanici)
            .Select(m => new 
            {
                MagazaId = m.Id,
                MagazaAdi = m.MagazaAdi,
                VergiNo = m.VergiNo,
                IletisimTelefonu = m.IletisimTelefonu,
                SaticiAdi = m.Kullanici.AdSoyad,
                SaticiEmail = m.Kullanici.Email,
                OnaylandiMi = m.OnaylandiMi 
            })
            .ToListAsync();
    }

    public async Task<(bool Basarili, string Mesaj)> MagazaReddetAsync(int magazaId)
    {
        var magaza = await _db.Magazalar
            .Include(m => m.Kullanici)
            .FirstOrDefaultAsync(m => m.Id == magazaId);

        if (magaza == null)
            return (false, "Mağaza bulunamadı.");

        if (magaza.OnaylandiMi)
            return (false, "Onaylanmış bir mağazayı reddedemezsiniz. Lütfen önce onayını kaldırın veya hesabı askıya alın.");

        try
        {
            _db.Magazalar.Remove(magaza);

            if (magaza.Kullanici != null)
            {
                _db.Kullanicilar.Remove(magaza.Kullanici);
            }

            await _db.SaveChangesAsync();
            return (true, "Mağaza başvurusu başarıyla reddedildi ve hesap silindi.");
        }
        catch (Exception ex)
        {
            return (false, $"Silme işlemi başarısız oldu: {ex.Message}");
        }
    }

    public async Task<object> OnayBekleyenUrunleriGetirAsync()
    {
        return await _db.Urunler
            .Include(u => u.Magaza)
            .Where(u => u.AdminOnayliMi == false)
            .Select(u => new {
                u.Id,
                u.Ad,
                u.Fiyat,
                Stok = u.Stok,
                ResimUrl = u.ResimUrl,
                MagazaAdi = u.Magaza != null ? u.Magaza.MagazaAdi : "Bilinmiyor",
                EklemeTarihi = u.OlusturulmaTarihi
            })
            .ToListAsync();
    }

    public async Task<(bool Basarili, string Mesaj)> UrunuOnaylaAsync(int urunId)
    {
        var urun = await _db.Urunler.FindAsync(urunId);
        
        if (urun == null) 
            return (false, "Ürün bulunamadı.");
            
        if (urun.AdminOnayliMi) 
            return (false, "Bu ürün zaten onaylanmış.");

        urun.AdminOnayliMi = true;
        await _db.SaveChangesAsync();

        return (true, "Ürün başarıyla onaylandı ve müşteri vitrinine açıldı.");
    }

    public async Task<(bool Basarili, string Mesaj)> UrunuReddetAsync(int urunId)
    {
        var urun = await _db.Urunler.FindAsync(urunId);
        
        if (urun == null) 
            return (false, "Ürün bulunamadı.");

        _db.Urunler.Remove(urun);
        await _db.SaveChangesAsync();
        
        return (true, "Ürün reddedildi ve sistemden kalıcı olarak silindi.");
    }

    public async Task<object> OnaylananUrunleriGetirAsync()
    {
        return await _db.Urunler
            .Include(u => u.Magaza)
            .Include(u => u.Kategori)
            .Where(u => u.AdminOnayliMi == true && u.AktifMi == true)
            .Select(u => new {
                id = u.Id,
                ad = u.Ad,
                fiyat = u.Fiyat,
                stok = u.Stok,
                resimUrl = u.ResimUrl,
                magazaAdi = u.Magaza != null ? u.Magaza.MagazaAdi : "Bilinmiyor"
            })
            .ToListAsync();
    }
}