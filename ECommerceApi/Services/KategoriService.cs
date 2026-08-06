using ECommerceApi.DataAccess;
using ECommerceApi.Entities;
using ECommerceApi.DTOs;
using Microsoft.EntityFrameworkCore;

namespace ECommerceApi.Services;

public class KategoriService : IKategoriService
{
    private readonly AppDbContext _db;

    public KategoriService(AppDbContext db)
    {
        _db = db;
    }

   public async Task<object> GetKategorilerAsync()
    {
        // Admin paneli için hiyerarşik (Ana kategori altında alt kategoriler) yapı
        return await _db.Kategoriler
            .Where(k => k.UstKategoriId == null)
            .Include(k => k.AltKategoriler)
            .Select(k => new 
            {
                Id = k.Id,
                Ad = k.Ad,
                AltKategoriler = k.AltKategoriler.Select(ak => new {
                    Id = ak.Id,
                    Ad = ak.Ad
                }).ToList()
            })
            .ToListAsync();
    }
    public async Task<object> GetTumKategorilerDuzAsync()
    {
        return await _db.Kategoriler
            .Select(k => new 
            {
                Id = k.Id,
                Ad = k.Ad,
                UstKategoriId = k.UstKategoriId
            })
            .ToListAsync();
    }

    public async Task<(bool Basarili, string Mesaj)> KategoriEkleAsync(KategoriEkledto dto)
    {
        // Eğer bir üst kategori ID'si gönderilmişse, böyle bir kategori gerçekten var mı kontrol et
        if (dto.UstKategoriId.HasValue)
        {
            var ustKategoriVarMi = await _db.Kategoriler.AnyAsync(k => k.Id == dto.UstKategoriId);
            if (!ustKategoriVarMi) return (false, "Belirtilen üst kategori bulunamadı.");
        }

        var yeniKategori = new Kategori
        {
            Ad = dto.Ad,
            UstKategoriId = dto.UstKategoriId
        };

        _db.Kategoriler.Add(yeniKategori);
        await _db.SaveChangesAsync(); 
        
        return (true, "Kategori başarıyla eklendi.");
    }

    public async Task<(bool Basarili, string Mesaj)> KategoriSilAsync(int id)
    {
        var kategori = await _db.Kategoriler.FindAsync(id);
        if (kategori == null) 
            return (false, "Kategori bulunamadı.");

        // KONTROL 1: Bu kategoriye bağlı alt kategoriler var mı?
        bool altKategoriVarMi = await _db.Kategoriler.AnyAsync(k => k.UstKategoriId == id);
        if (altKategoriVarMi) 
            return (false, "Bu kategorinin altında başka kategoriler var. Önce alt kategorileri silmelisiniz.");

        // KONTROL 2: Bu kategoriye bağlı ürünler var mı?
        bool urunVarMi = await _db.Urunler.AnyAsync(u => u.KategoriId == id);
        if (urunVarMi) 
            return (false, "Bu kategoriye ait ürünler olduğu için silinemez. Önce ürünlerin kategorisini değiştirin."); 

        _db.Kategoriler.Remove(kategori);
        await _db.SaveChangesAsync();
        return (true, "Kategori başarıyla silindi.");
    }
}