using ECommerceApi.DataAccess;
using ECommerceApi.Entities;
using ECommerceApi.DTOs;
using Microsoft.EntityFrameworkCore;

namespace ECommerceApi.Services;

public class SepetService : ISepetService
{
    private readonly AppDbContext _db;

    public SepetService(AppDbContext db)
    {
        _db = db;
    }

  public async Task<object> SepetiGetirAsync(int userId)
    {
        return await _db.SepetUrunleri
            .Where(c => c.KullaniciId == userId)
            .Include(c => c.Urunler)
                .ThenInclude(u => u!.Magaza) // Mağaza ilişkisini dahil ediyoruz
            .Select(c => new 
            {
                Id = c.Id,
                UrunId = c.UrunId, // Sepet satırındaki UrunId
                Miktar = c.Miktar,
                Urunler = c.Urunler != null ? new 
                {
                    Id = c.Urunler.Id, // Ürünün kendi ID'si
                    MagazaId = c.Urunler.MagazaId, // Ürünün ait olduğu mağazanın ID'si
                    Ad = c.Urunler.Ad,
                    Fiyat = c.Urunler.IndirimliFiyat ?? c.Urunler.Fiyat, 
                    ResimUrl = c.Urunler.ResimUrl,
                    Magaza = c.Urunler.Magaza != null ? new {
                        Id = c.Urunler.Magaza.Id,
                        MagazaAdi = c.Urunler.Magaza.MagazaAdi
                    } : null
                } : null
            })
            .ToListAsync();
    }
   
    public async Task<(bool Basarili, string Mesaj)> SepeteEkleAsync(int userId, SepeteEkleDTO dto)
    {
        var urun = await _db.Urunler.FindAsync(dto.UrunId);
        if (urun == null) return (false, "Ürün bulunamadı.");

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
        return (true, "Ürün sepete başarıyla eklendi.");
    }

    // 3. SİLME İŞLEMİ
    public async Task<(bool Basarili, string Mesaj)> SepettenSilAsync(int userId, int id)
    {
        var item = await _db.SepetUrunleri
            .FirstOrDefaultAsync(c => c.Id == id && c.KullaniciId == userId);
        
        if (item == null) return (false, "Ürün sepette bulunamadı.");

        _db.SepetUrunleri.Remove(item);
        await _db.SaveChangesAsync();
        
        return (true, "Ürün sepetten silindi.");
    }

    // 4. MİKTAR GÜNCELLEME
    public async Task<(bool Basarili, string Mesaj)> MiktarGuncelleAsync(int userId, int id, MiktarGuncelleDTO dto)
    {
        var item = await _db.SepetUrunleri
            .FirstOrDefaultAsync(c => c.Id == id && c.KullaniciId == userId);
        
        if (item == null) return (false, "Ürün sepette bulunamadı.");

        item.Miktar = dto.Miktar;
        await _db.SaveChangesAsync();
        
        return (true, "Miktar güncellendi.");
    }
}