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
        // 1. Temel Sayaçlar
        var toplamUrun = await _db.Urunler.CountAsync();
        var toplamKullanici = await _db.Kullanicilar.CountAsync();
        var beklemedeOlanSiparisler = await _db.Siparisler.CountAsync(s => s.Durum == "Hazırlanıyor");

        // --- YENİ: PAZARLAMA VE CİRO ANALİTİĞİ ---
        var simdikiYil = DateTime.UtcNow.Year;
        var simdikiAy = DateTime.UtcNow.Month;

        // Sadece durumu "Tamamlandı" olan başarılı siparişleri baz alıyoruz
        var basariliSiparisler = _db.Siparisler.Where(s => s.Durum == "Tamamlandı");

        var toplamCiro = await basariliSiparisler.SumAsync(s => s.ToplamTutar);
        var basariliSiparisSayisi = await basariliSiparisler.CountAsync();

        // Bu ayki ciro hesabı
        var aylikCiro = await basariliSiparisler
            .Where(s => s.SiparisTarihi.Year == simdikiYil && s.SiparisTarihi.Month == simdikiAy)
            .SumAsync(s => s.ToplamTutar);

        // En Çok Satan İlk 5 Ürün
        var enCokSatanlar = await basariliSiparisler
            .SelectMany(s => s.Detaylar) // Siparişlerin içindeki ürün detaylarına iniyoruz
            .GroupBy(d => new { d.UrunId, UrunAdi = d.Urunler != null ? d.Urunler.Ad : "Silinmiş Ürün" }) // Ürün bazında grupluyoruz
            .Select(g => new 
            {
                UrunId = g.Key.UrunId,
                UrunAdi = g.Key.UrunAdi,
                ToplamSatisAdedi = g.Sum(x => x.Adet),
                ToplamKazanc = g.Sum(x => x.Adet * x.BirimFiyat)
            })
            .OrderByDescending(x => x.ToplamSatisAdedi) // Satış adedine göre çoktan aza sırala
            .Take(5) // Sadece en çok satan 5 ürünü al
            .ToListAsync();

        // Tüm verileri Anonim Obje olarak döndürüyoruz
        return new
        {
            ToplamUrun = toplamUrun,
            ToplamKullanici = toplamKullanici,
            BekleyenSiparisler = beklemedeOlanSiparisler,
            
            // Yeni Pazarlama Verileri
            ToplamCiro = toplamCiro,
            AylikCiro = aylikCiro,
            BasariliSiparisSayisi = basariliSiparisSayisi,
            EnCokSatanlar = enCokSatanlar
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
                Telefon = x.Siparis.Telefon, 
                
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

    public async Task<(bool Basarili, string Mesaj)> KullaniciSilAsync(int userId)
    {
        var kullanici = await _db.Kullanicilar
            .IgnoreQueryFilters() 
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (kullanici == null) return (false, "Kullanıcı bulunamadı.");
        
        // --- GÜVENLİK KALKANI: Admin kendini veya başka admini silemez ---
        if (kullanici.Rol == "Admin") 
        {
            return (false, "Kritik Hata: Sistem yöneticisi hesabı askıya alınamaz!");
        }

        // 2. Yumuşak silme (Soft Delete) işlemini gerçekleştir
        kullanici.IsDeleted = true;
        kullanici.DeletedAt = DateTime.UtcNow;

        try 
        {
            await _db.SaveChangesAsync();
            return (true, "Kullanıcı başarıyla askıya alındı.");
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

        await _db.SaveChangesAsync();
        return (true, "Kullanıcı başarıyla aktifleştirildi.");
    }
}