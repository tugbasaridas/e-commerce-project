using ECommerceApi.DataAccess;
using ECommerceApi.Entities;
using ECommerceApi.DTOs;
using Microsoft.EntityFrameworkCore;

namespace ECommerceApi.Services;

public class UrunService : IUrunService
{
    private readonly AppDbContext _db;
    public UrunService(AppDbContext db) => _db = db;

    public async Task<List<UrunListelemeDTO>> TumUrunleriGetirAsync()
    {
        return await _db.Urunler
            .Include(u => u.Kategori)
            .Include(u => u.Magaza).ThenInclude(m => m.Kullanici)
            .Where(u => u.AdminOnayliMi == true && 
                        u.AktifMi == true && 
                        u.Magaza != null && 
                        u.Magaza.OnaylandiMi == true && 
                        !u.Magaza.Kullanici.IsDeleted)
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
            }).ToListAsync();
    }

    public async Task<object?> UrunGetirByIdAsync(int id)
    {
        return await _db.Urunler
            .Include(u => u.Kategori)
            .Include(u => u.Magaza).ThenInclude(m => m.Kullanici)
            .Where(u => u.AdminOnayliMi == true && u.AktifMi == true && u.Magaza.OnaylandiMi == true && !u.Magaza.Kullanici.IsDeleted)
            .Select(u => new {
                u.Id, u.Ad, u.Aciklama, u.Fiyat, u.IndirimliFiyat, u.Stok, u.ResimUrl, u.KategoriId, u.Kategori,
                Magaza = new { u.Magaza.Id, u.Magaza.MagazaAdi, u.Magaza.OrtalamaPuan },
                OrtalamaPuan = u.Oylamalar.Any() ? Math.Round(u.Oylamalar.Average(o => o.Puan), 1) : 0.0, 
                OylamaSayisi = u.Oylamalar.Count(),
                Yorumlar = u.Oylamalar.Select(o => new { 
                    o.Id, o.Puan, o.YorumMetni, o.Tarih, 
                    KullaniciAdi = o.Kullanicilar != null ? o.Kullanicilar.AdSoyad : "İsimsiz" 
                }).OrderByDescending(x => x.Tarih).ToList()
            }).FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<List<UrunListelemeDTO>> IndirimliUrunleriGetirAsync()
    {
        return await _db.Urunler
            .Where(u => u.IndirimliFiyat != null)
            .Include(u => u.Kategori)
            .Include(u => u.Magaza).ThenInclude(m => m.Kullanici)
            .Where(u => u.AdminOnayliMi == true && u.AktifMi == true && u.Magaza.OnaylandiMi == true && !u.Magaza.Kullanici.IsDeleted)
            .Select(u => new UrunListelemeDTO {
                Id = u.Id, Ad = u.Ad, Aciklama = u.Aciklama, Fiyat = u.Fiyat, IndirimliFiyat = u.IndirimliFiyat, 
                Stok = u.Stok, ResimUrl = u.ResimUrl, KategoriId = u.KategoriId,
                Kategori = u.Kategori != null ? new { u.Kategori.Id, u.Kategori.Ad } : null,
                OrtalamaPuan = u.Oylamalar.Any() ? Math.Round(u.Oylamalar.Average(o => o.Puan), 1) : 0.0, 
                OylamaSayisi = u.Oylamalar.Count()
            }).OrderByDescending(u => u.Id).ToListAsync();
    }

    public async Task<(bool Basarili, string Mesaj)> UrunOylaAsync(int urunId, int userId, int puan, string? yorum = null)
    {
        var urunuSatinAlmisMi = await _db.SiparisDetaylari.Include(sd => sd.Siparis)
            .AnyAsync(sd => sd.UrunId == urunId && sd.Siparis!.KullaniciId == userId && sd.Siparis.Durum == "Tamamlandı"); 
            
        if (!urunuSatinAlmisMi) return (false, "Bu ürünü oylayabilmek için satın almış olmanız gerekmektedir.");
        
        var mevcutOylama = await _db.Oylamalar.FirstOrDefaultAsync(o => o.UrunId == urunId && o.KullaniciId == userId);
        if (mevcutOylama != null)
        {
            mevcutOylama.Puan = puan;
            if (!string.IsNullOrWhiteSpace(yorum)) mevcutOylama.YorumMetni = yorum;
            mevcutOylama.Tarih = DateTime.UtcNow;
        }
        else
        {
            await _db.Oylamalar.AddAsync(new Oylama { UrunId = urunId, KullaniciId = userId, Puan = puan, YorumMetni = yorum, Tarih = DateTime.UtcNow });
        }
        await _db.SaveChangesAsync();
        return (true, "Oylama başarılı.");
    }
}