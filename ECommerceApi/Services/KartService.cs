using ECommerceApi.DataAccess;
using ECommerceApi.Entities;
using ECommerceApi.DTOs;
using Microsoft.EntityFrameworkCore;

namespace ECommerceApi.Services;

public class KartService : IKartService
{
    private readonly AppDbContext _db;

    public KartService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<object> SepetiGetirAsync(int userId)
    {
        return await _db.SepetUrunleri
            .Where(c => c.KullaniciId == userId)
            .Include(c => c.Urunler)
            .Select(c => new 
            {
                Id = c.Id,
                UrunId = c.UrunId,
                Miktar = c.Miktar,
                Urunler = c.Urunler != null ? new 
                {
                    Ad = c.Urunler.Ad,
                    Fiyat = c.Urunler.Fiyat,
                    ResimUrl = c.Urunler.ResimUrl 
                } : null
            })
            .ToListAsync();
    }

    public async Task<(bool Basarili, string Mesaj)> SepeteEkleAsync(int userId, SepeteEkleDTO dto)
    {
        var mevcutUrun = await _db.SepetUrunleri
            .FirstOrDefaultAsync(c => c.KullaniciId == userId && c.UrunId == dto.UrunId);

        if (mevcutUrun != null)
        {
            mevcutUrun.Miktar += dto.Miktar;
        }
        else
        {
            _db.SepetUrunleri.Add(new Karturun 
            { 
                KullaniciId = userId, 
                UrunId = dto.UrunId, 
                Miktar = dto.Miktar 
            });
        }
        
        await _db.SaveChangesAsync();
        return (true, "Sepet güncellendi.");
    }

    public async Task<(bool Basarili, string Mesaj)> SepettenSilAsync(int userId, int id)
    {
        var item = await _db.SepetUrunleri.FirstOrDefaultAsync(c => c.Id == id && c.KullaniciId == userId);
        
        if (item == null) return (false, "Ürün sepette bulunamadı.");

        _db.SepetUrunleri.Remove(item);
        await _db.SaveChangesAsync();
        
        return (true, "Ürün sepetten silindi.");
    }

    public async Task<(bool Basarili, string Mesaj)> MiktarGuncelleAsync(int userId, int id, MiktarGuncelleDTO dto)
    {
        var item = await _db.SepetUrunleri.FirstOrDefaultAsync(c => c.Id == id && c.KullaniciId == userId);
        
        if (item == null) return (false, "Ürün sepette bulunamadı.");

        item.Miktar = dto.Miktar;
        await _db.SaveChangesAsync();
        
        return (true, "Miktar başarıyla güncellendi.");
    }
}