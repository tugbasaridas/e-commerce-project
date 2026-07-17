using ECommerceApi.DataAccess;
using ECommerceApi.Entities;
using ECommerceApi.DTOs;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ECommerceApi.Services;

public class UrunService : IUrunService
{
    private readonly AppDbContext _db;
    public UrunService(AppDbContext db) => _db = db;

    public async Task<List<UrunListelemeDTO>> TumUrunleriGetirAsync()
    {
        // --- 1. ADIM: OTOMATİK TEMİZLİK (Süresi dolan indirimleri kaldır) ---
        var suresiBitenler = await _db.Urunler
            .Where(u => u.IndirimBitisTarihi != null && u.IndirimBitisTarihi < DateTime.UtcNow)
            .ToListAsync();

        if (suresiBitenler.Any())
        {
            foreach (var u in suresiBitenler)
            {
                u.IndirimliFiyat = null;
                u.IndirimBitisTarihi = null;
            }
            await _db.SaveChangesAsync(); // Temizliği kaydet
        }

        // --- 2. ADIM: ÜRÜNLERİ LİSTELE ---
        return await _db.Urunler
            .Include(u => u.Kategori)
            .Select(u => new UrunListelemeDTO {
                Id = u.Id,
                Ad = u.Ad,
                Aciklama = u.Aciklama,
                Fiyat = u.Fiyat, 
                IndirimliFiyat = u.IndirimliFiyat, 
                Stok = u.Stok, 
                ResimUrl = u.ResimUrl,
                KategoriId = u.KategoriId,
                Kategori = u.Kategori != null ? new { u.Kategori.Id, u.Kategori.Ad } : null,
                OrtalamaPuan = u.Oylamalar.Any() ? Math.Round(u.Oylamalar.Average(o => o.Puan), 1) : 0.0,
                OylamaSayisi = u.Oylamalar.Count()
            })
            .ToListAsync();
    }

    public async Task<object?> UrunGetirByIdAsync(int id)
    {
        return await _db.Urunler
            .Include(u => u.Kategori)
            .Select(u => new {
                u.Id, 
                u.Ad, 
                u.Aciklama, 
                u.Fiyat, 
                u.IndirimliFiyat, 
                u.Stok, 
                u.ResimUrl, 
                u.KategoriId, 
                u.Kategori,
                OrtalamaPuan = u.Oylamalar.Any() ? Math.Round(u.Oylamalar.Average(o => o.Puan), 1) : 0.0,
                OylamaSayisi = u.Oylamalar.Count(),
                
                // İŞTE EKSİK OLAN KISIM: Yorumları çekip frontend'e yolluyoruz
                Yorumlar = u.Oylamalar.Select(o => new {
                    o.Id,
                    o.Puan,
                    o.YorumMetni,
                    o.Tarih,
                    KullaniciAdi = o.Kullanicilar != null ? o.Kullanicilar.AdSoyad : "İsimsiz Kullanıcı"
                }).OrderByDescending(x => x.Tarih).ToList()
            })
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<Urunler> UrunEkleAsync(UrunEkleDTO dto) 
    {
        var yeniUrun = new Urunler {
            Ad = dto.Ad, 
            Aciklama = dto.Aciklama, 
            Fiyat = dto.Fiyat, 
            Stok = dto.Stok, 
            ResimUrl = dto.ResimUrl, 
            KategoriId = dto.KategoriId
        };
        _db.Urunler.Add(yeniUrun);
        await _db.SaveChangesAsync();
        return yeniUrun;
    }

    public async Task<bool> UrunSilAsync(int id)
    {
        var urun = await _db.Urunler.FindAsync(id);
        if (urun is null) return false;
        
        _db.Urunler.Remove(urun);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<Urunler?> UrunGuncelleAsync(int id, UrunGuncelleDto guncelUrun)
    {
        var mevcutUrun = await _db.Urunler.FindAsync(id);
        if (mevcutUrun is null) return null;
        
        if (!string.IsNullOrWhiteSpace(guncelUrun.Ad)) 
            mevcutUrun.Ad = guncelUrun.Ad;
            
        if (guncelUrun.Aciklama != null) 
            mevcutUrun.Aciklama = guncelUrun.Aciklama;
            
        if (guncelUrun.Fiyat.HasValue && guncelUrun.Fiyat.Value > 0) 
            mevcutUrun.Fiyat = guncelUrun.Fiyat.Value;
            
        if (!string.IsNullOrWhiteSpace(guncelUrun.ResimUrl)) 
            mevcutUrun.ResimUrl = guncelUrun.ResimUrl;

        if (guncelUrun.KategoriId.HasValue && guncelUrun.KategoriId.Value > 0)
            mevcutUrun.KategoriId = guncelUrun.KategoriId.Value;

        if (guncelUrun.Stok.HasValue)
            mevcutUrun.Stok = guncelUrun.Stok.Value;

        await _db.SaveChangesAsync();
        return mevcutUrun;
    }

    public async Task<(bool Basarili, string Mesaj)> UrunOylaAsync(int urunId, int userId, int puan, string? yorum = null)
    {
        var urunuSatinAlmisMi = await _db.SiparisDetaylari
            .Include(sd => sd.Siparis)
            .AnyAsync(sd => sd.Siparis != null
                         && sd.UrunId == urunId 
                         && sd.Siparis.KullaniciId == userId
                         && sd.Siparis.Durum == "Tamamlandı"); 

        if (!urunuSatinAlmisMi)
        {
            return (false, "Bu ürünü oylayabilmek veya yorum yapabilmek için önce satın alıp teslim almış olmanız gerekmektedir.");
        }

        var urunVarMi = await _db.Urunler.AnyAsync(u => u.Id == urunId);
        if (!urunVarMi) return (false, "Ürün bulunamadı.");

        var mevcutOylama = await _db.Oylamalar
            .FirstOrDefaultAsync(o => o.UrunId == urunId && o.KullaniciId == userId);

        // Kullanıcı daha önce oylamışsa puanını ve (varsa) yorumunu güncelliyoruz
        if (mevcutOylama != null)
        {
            mevcutOylama.Puan = puan;
            // Eğer yeni bir yorum gönderilmişse (boş değilse) onu da güncelle
            if (!string.IsNullOrWhiteSpace(yorum))
            {
                mevcutOylama.YorumMetni = yorum;
            }
            mevcutOylama.Tarih = DateTime.UtcNow;
        }
        else
        {
          
            var yeniOylama = new Oylama
            {
                UrunId = urunId,
                KullaniciId = userId,
                Puan = puan,
                YorumMetni = yorum, 
                Tarih = DateTime.UtcNow
            };
            await _db.Oylamalar.AddAsync(yeniOylama);
        }

        try
        {
            await _db.SaveChangesAsync();
            return (true, "Başarılı");
        }
        catch (Exception ex)
        {
            return (false, "Veritabanı hatası: " + ex.Message);
        }
    }

    public async Task<List<UrunListelemeDTO>> IndirimliUrunleriGetirAsync()
    {
        // --- 1. ADIM: OTOMATİK TEMİZLİK (Süresi dolan indirimleri kaldır) ---
        var suresiBitenler = await _db.Urunler
            .Where(u => u.IndirimBitisTarihi != null && u.IndirimBitisTarihi < DateTime.UtcNow)
            .ToListAsync();

        if (suresiBitenler.Any())
        {
            foreach (var u in suresiBitenler)
            {
                u.IndirimliFiyat = null;
                u.IndirimBitisTarihi = null;
            }
            await _db.SaveChangesAsync(); 
        }

        // --- 2. ADIM: İNDİRİMLİ ÜRÜNLERİ LİSTELE ---
        return await _db.Urunler
            .Where(u => u.IndirimliFiyat != null) 
            .Include(u => u.Kategori)
            .Select(u => new UrunListelemeDTO {
                Id = u.Id,
                Ad = u.Ad,
                Aciklama = u.Aciklama,
                Fiyat = u.Fiyat,
                IndirimliFiyat = u.IndirimliFiyat, 
                Stok = u.Stok, 
                ResimUrl = u.ResimUrl,
                KategoriId = u.KategoriId,
                Kategori = u.Kategori != null ? new { u.Kategori.Id, u.Kategori.Ad } : null,
                OrtalamaPuan = u.Oylamalar.Any() ? Math.Round(u.Oylamalar.Average(o => o.Puan), 1) : 0.0,
                OylamaSayisi = u.Oylamalar.Count()
            })
            .OrderByDescending(u => u.Id)
            .ToListAsync();
    }

    // UrunService.cs içindeki metodu şu şekilde güncelle:
    public async Task<(bool Basarili, string Mesaj)> IndirimYapAsync(int urunId, decimal yeniFiyat, int saat)
    {
        var urun = await _db.Urunler.FindAsync(urunId);
        if (urun == null) return (false, "Ürün bulunamadı.");

        if (yeniFiyat >= urun.Fiyat) 
            return (false, "İndirimli fiyat, asıl liste fiyatından daha düşük olmalıdır!");

        urun.IndirimliFiyat = yeniFiyat;
        // Dinamik saat eklemesi
        urun.IndirimBitisTarihi = DateTime.UtcNow.AddHours(saat);
        
        await _db.SaveChangesAsync();
        return (true, $"İndirim başarıyla {saat} saat boyunca uygulandı.");
    }

    public async Task<(bool Basarili, string Mesaj)> IndirimiKaldirAsync(int urunId)
    {
        var urun = await _db.Urunler.FindAsync(urunId);
        if (urun == null) return (false, "Ürün bulunamadı.");

        // Eğer ürün indirimdeyse (veya süresi devam ediyorsa)
        if (urun.IndirimliFiyat != null || urun.IndirimBitisTarihi != null)
        {
            urun.IndirimliFiyat = null; // Fiyatı eski haline döndür
            
            // --- YENİ EKLENDİ: ZAMANLAYICIYI DA SİL ---
            urun.IndirimBitisTarihi = null; 
            
            await _db.SaveChangesAsync();
            return (true, "İndirim admin tarafından iptal edildi ve fiyat eski haline döndü.");
        }

        return (false, "Bu ürün zaten indirimde değil.");
    }
}