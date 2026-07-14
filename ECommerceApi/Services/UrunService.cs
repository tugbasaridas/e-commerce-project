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
        return await _db.Urunler
            .Include(u => u.Kategori)
            .Select(u => new UrunListelemeDTO {
                Id = u.Id,
                Ad = u.Ad,
                Aciklama = u.Aciklama,
                Fiyat = u.Fiyat, // Asıl liste fiyatı
                IndirimliFiyat = u.IndirimliFiyat, // Varsa indirimli fiyat
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
                u.IndirimliFiyat, // Detay sayfasında göstermek için eklendi
                u.Stok, 
                u.ResimUrl, 
                u.KategoriId, 
                u.Kategori,
                OrtalamaPuan = u.Oylamalar.Any() ? Math.Round(u.Oylamalar.Average(o => o.Puan), 1) : 0.0,
                OylamaSayisi = u.Oylamalar.Count()
            })
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<Urunler> UrunEkleAsync(UrunEkleDTO dto) 
    {
        var yeniUrun = new Urunler {
            Ad = dto.Ad, 
            Aciklama = dto.Aciklama, 
            Fiyat = dto.Fiyat, // Eklendiğinde sadece asıl fiyat var
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

    public async Task<(bool Basarili, string Mesaj)> UrunOylaAsync(int urunId, int userId, int puan)
    {
        var urunuSatinAlmisMi = await _db.SiparisDetaylari
            .Include(sd => sd.Siparis)
            .AnyAsync(sd => sd.Siparis != null
                         && sd.UrunId == urunId 
                         && sd.Siparis.KullaniciId == userId
                         && sd.Siparis.Durum == "Tamamlandı"); 

        if (!urunuSatinAlmisMi)
        {
            return (false, "Bu ürünü oylayabilmek için önce satın alıp teslim almış olmanız gerekmektedir.");
        }

        var urunVarMi = await _db.Urunler.AnyAsync(u => u.Id == urunId);
        if (!urunVarMi) return (false, "Ürün bulunamadı.");

        var mevcutOylama = await _db.Oylamalar
            .FirstOrDefaultAsync(o => o.UrunId == urunId && o.KullaniciId == userId);

        if (mevcutOylama != null)
        {
            mevcutOylama.Puan = puan;
            mevcutOylama.Tarih = DateTime.UtcNow;
        }
        else
        {
            var yeniOylama = new Oylama
            {
                UrunId = urunId,
                KullaniciId = userId,
                Puan = puan,
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
        return await _db.Urunler
            .Where(u => u.IndirimliFiyat != null) // Sadece IndirimliFiyat dolu olanları getir
            .Include(u => u.Kategori)
            .Select(u => new UrunListelemeDTO {
                Id = u.Id,
                Ad = u.Ad,
                Aciklama = u.Aciklama,
                Fiyat = u.Fiyat,
                IndirimliFiyat = u.IndirimliFiyat, // <-- Yeni modele tam uyumlu
                ResimUrl = u.ResimUrl,
                KategoriId = u.KategoriId,
                Kategori = u.Kategori != null ? new { u.Kategori.Id, u.Kategori.Ad } : null,
                OrtalamaPuan = u.Oylamalar.Any() ? Math.Round(u.Oylamalar.Average(o => o.Puan), 1) : 0.0,
                OylamaSayisi = u.Oylamalar.Count()
            })
            .OrderByDescending(u => u.Id)
            .ToListAsync();
    }

    public async Task<(bool Basarili, string Mesaj)> IndirimYapAsync(int urunId, decimal yeniFiyat)
    {
        var urun = await _db.Urunler.FindAsync(urunId);
        if (urun == null) return (false, "Ürün bulunamadı.");

        // İndirimli fiyat, asıl fiyattan küçük olmak zorunda
        if (yeniFiyat >= urun.Fiyat) 
            return (false, "İndirimli fiyat, asıl liste fiyatından daha düşük olmalıdır!");

        // Fiyat'a (orijinal değere) ASLA DOKUNMUYORUZ. Sadece IndirimliFiyat'ı güncelliyoruz.
        urun.IndirimliFiyat = yeniFiyat;
        
        await _db.SaveChangesAsync();
        return (true, "İndirim başarıyla uygulandı.");
    }

    public async Task<(bool Basarili, string Mesaj)> IndirimiKaldirAsync(int urunId)
    {
        var urun = await _db.Urunler.FindAsync(urunId);
        if (urun == null) return (false, "Ürün bulunamadı.");

        if (urun.IndirimliFiyat != null)
        {
            // İndirimi sıfırlıyoruz. Fiyat sütunu zaten korunduğu için başka işlem gerekmiyor.
            urun.IndirimliFiyat = null; 
            
            await _db.SaveChangesAsync();
            return (true, "İndirim başarıyla kaldırıldı ve fiyat eski haline döndü.");
        }

        return (false, "Bu ürün zaten indirimde değil.");
    }
}