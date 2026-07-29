using ECommerceApi.DataAccess;
using ECommerceApi.Entities;
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

        // --- YENİ EKLENEN: BİLDİRİM (BADGE) SAYILARI ---
        var bekleyenSiparisler = await _db.Siparisler.CountAsync(s => s.Durum == "Hazırlanıyor");
        var bekleyenMagazaSayisi = await _db.Magazalar.CountAsync(m => m.OnaylandiMi == false);
        var bekleyenUrunSayisi = await _db.Urunler.CountAsync(u => u.AdminOnayliMi == false);
        
        var bekleyenDestekSayisi = await _db.DestekTalepleri.CountAsync(d => d.Durum == "Bekliyor");

        // --- PAZARLAMA VE CİRO ANALİTİĞİ ---
        var simdikiYil = DateTime.UtcNow.Year;
        var simdikiAy = DateTime.UtcNow.Month;

        var basariliSiparisler = _db.Siparisler.Where(s => s.Durum == "Tamamlandı" || s.Durum == "Teslim Edildi");

        var toplamCiro = await basariliSiparisler.SumAsync(s => s.ToplamTutar);
        var platformKazanci = toplamCiro * 0.10m;
        var basariliSiparisSayisi = await basariliSiparisler.CountAsync();

        var aylikCiro = await basariliSiparisler
            .Where(s => s.SiparisTarihi.Year == simdikiYil && s.SiparisTarihi.Month == simdikiAy)
            .SumAsync(s => s.ToplamTutar);

        var enCokSatanlar = await basariliSiparisler
            .SelectMany(s => s.Detaylar!) 
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
                ToplamKazanc = g.Sum(x => x.Adet * x.BirimFiyat)
            })
            .OrderByDescending(x => x.ToplamSatisAdedi) 
            .Take(5) 
            .ToListAsync();

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
            
            // BİLDİRİM VERİLERİ (Küçük harfle gönderiyoruz ki JS tarafı rahat yakalasın)
            bekleyenSiparis = bekleyenSiparisler,
            bekleyenMagaza = bekleyenMagazaSayisi,
            bekleyenUrun = bekleyenUrunSayisi,
            bekleyenDestek = bekleyenDestekSayisi
        };
    }
   public async Task<object> TumSiparisleriGetirAsync()
    {
        return await _db.Siparisler
            .Include(s => s.Detaylar)
                .ThenInclude(d => d.Urunler)
                    .ThenInclude(u => u!.Magaza) 
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
                Telefon = x.Siparis.Telefon, 
                KullaniciId = x.Siparis.KullaniciId, 
                KullaniciAdSoyad = x.Kullanici.AdSoyad,
                KullaniciEmail = x.Kullanici.Email,

                // İŞTE BACKEND'DEKİ KESİN KAZANÇ HESAPLAMASI
                AdminKazanci = x.Siparis.ToplamTutar * 0.10m,
                SaticiKazanci = x.Siparis.ToplamTutar * 0.90m,

                Urunler = x.Siparis.Detaylar!.Select(d => new
                {
                    DetayId = d.Id, 
                    UrunId = d.UrunId,
                    Ad = d.Urunler != null ? d.Urunler!.Ad : "Silinmiş Ürün",
                    MagazaAdi = d.Urunler != null && d.Urunler.Magaza != null ? d.Urunler!.Magaza!.MagazaAdi : "Bilinmiyor",
                    Adet = d.Adet,
                    BirimFiyat = d.BirimFiyat,
                    Durum = d.Durum, 
                    KargoFirma = d.KargoFirma,
                    KargoTakipNo = d.KargoTakipNo
                }).ToList()
            })
            .ToListAsync();
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

        // --- AKILLI ANA SİPARİŞ DURUMU HESAPLAYICI ---
        var siparis = detay.Siparis; 
        
        if (siparis != null && siparis.Detaylar != null)
        {
            var tumDurumlar = siparis.Detaylar.Where(x => x != null).Select(d => d!.Durum ?? "").ToList();

            // 1. KURAL: Eğer bütün ürünler iptal edildiyse, ana sipariş "İptal Edildi" olur!
            if (tumDurumlar.All(d => d == "İptal Edildi" || d == "İptal"))
            {
                siparis.Durum = "İptal Edildi";
            }
            // 2. KURAL: Eğer bazıları Tamamlandı, bazıları İptal ise ana sipariş "Tamamlandı" olur.
            else if (tumDurumlar.All(d => d == "Tamamlandı" || d == "İptal Edildi" || d == "İptal"))
            {
                siparis.Durum = "Tamamlandı";
            }
            // 3. KURAL: Eğer bazıları Kargoya Verildi ise ana sipariş "Kargoya Verildi" olur.
            else if (tumDurumlar.All(d => d == "Kargoya Verildi" || d == "Tamamlandı" || d == "İptal Edildi" || d == "İptal"))
            {
                siparis.Durum = "Kargoya Verildi";
            }
            // HİÇBİRİ DEĞİLSE: Demek ki hala hazırlanan ürün var.
            else
            {
                siparis.Durum = "Hazırlanıyor";
            }
        }

        await _db.SaveChangesAsync();
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

        // 2. YENİ EKLENEN KISIM: Eğer bu kullanıcı bir satıcıysa, mağazasını ve ürünlerini de PASİFE ÇEK
        var magaza = await _db.Magazalar.FirstOrDefaultAsync(m => m.KullaniciId == userId);
        if (magaza != null)
        {
            // Mağazaya ait tüm ürünlerin AktifMi durumunu false yapıyoruz
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

        // Satıcı aktifleştiğinde mağazasını ve ürünlerini tekrar aktif yap
        var magaza = await _db.Magazalar.FirstOrDefaultAsync(m => m.KullaniciId == userId);
        if (magaza != null)
        {
            var saticininUrunleri = await _db.Urunler.Where(u => u.MagazaId == magaza.Id).ToListAsync();
            foreach (var urun in saticininUrunleri)
            {
                // Ürünü tekrar aktif yapıyoruz. 
                // Not: Eğer ürünün daha önce admin onayı vardıysa bu şekilde doğrudan vitrine döner.
                urun.AktifMi = true; 
            }
        }

        await _db.SaveChangesAsync();
        return (true, "Kullanıcı başarıyla aktifleştirildi ve ürünleri tekrar yayına alındı.");
    }
    // 1. Bekleyen Mağazaları Listeleme Metodu
    public async Task<object> BekleyenMagazalariGetirAsync()
    {
        // Onaylanmamış (OnaylandiMi == false) mağazaları ve onlara ait kullanıcı bilgilerini getir
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

    // 2. Mağaza Onaylama Metodu
    public async Task<bool> MagazaOnaylaAsync(int magazaId)
    {
        var magaza = await _db.Magazalar.FirstOrDefaultAsync(m => m.Id == magazaId);
        if (magaza == null) 
            throw new Exception("Mağaza bulunamadı.");

        if (magaza.OnaylandiMi) 
            throw new Exception("Bu mağaza zaten onaylanmış.");

        // Onay durumunu true yapıyoruz
        magaza.OnaylandiMi = true;
        await _db.SaveChangesAsync();

        return true;
    }

    public async Task<object> TumMagazalariGetirAsync()
    {
        // Onaylı veya onaysız TÜM mağazaları getiriyoruz
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

    // YENİ EKLENEN: Mağaza Reddetme ve Kullanıcıyı Silme Metodu
    public async Task<(bool Basarili, string Mesaj)> MagazaReddetAsync(int magazaId)
    {
        // 1. Önce mağazayı bul ve bağlı olduğu kullanıcıyı da getir
        var magaza = await _db.Magazalar
            .Include(m => m.Kullanici)
            .FirstOrDefaultAsync(m => m.Id == magazaId);

        if (magaza == null)
            return (false, "Mağaza bulunamadı.");

        if (magaza.OnaylandiMi)
            return (false, "Onaylanmış bir mağazayı reddedemezsiniz. Lütfen önce onayını kaldırın veya hesabı askıya alın.");

        try
        {
            // 2. Önce mağaza kaydını veritabanından tamamen sil
            _db.Magazalar.Remove(magaza);

            // 3. Ardından, bu mağazayı açmak için başvuran "Satıcı" kullanıcısını tamamen sil
            // (Soft delete yapmıyoruz, çünkü başvurusu reddedilen kişinin tekrar başvurabilmesi için e-postasını serbest bırakmalıyız)
            if (magaza.Kullanici != null)
            {
                _db.Kullanicilar.Remove(magaza.Kullanici);
            }

            // 4. Değişiklikleri kaydet
            await _db.SaveChangesAsync();
            return (true, "Mağaza başvurusu başarıyla reddedildi ve hesap silindi.");
        }
        catch (Exception ex)
        {
            // Olası Foreign Key veya veritabanı hatalarında catch'e düşer
            return (false, $"Silme işlemi başarısız oldu: {ex.Message}");
        }
    }
    // --- YENİ: ÜRÜN ONAY SİSTEMİ ---
    
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

        // Reddedilen ürünü veritabanından siliyoruz (veya istersen bir "Reddedildi" durumu ekleyebilirsin)
        _db.Urunler.Remove(urun);
        await _db.SaveChangesAsync();
        
        return (true, "Ürün reddedildi ve sistemden kalıcı olarak silindi.");
    }
}