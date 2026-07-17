using ECommerceApi.DataAccess;
using ECommerceApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace ECommerceApi.Services;

public class KategoriService : IKategoriService
{
    private readonly AppDbContext _db;

    public KategoriService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<Kategori>> GetKategorilerAsync()
    {
        return await _db.Kategoriler.ToListAsync();
    }

    public async Task<Kategori> KategoriEkleAsync(Kategori yeniKategori)
    {
        _db.Kategoriler.Add(yeniKategori);
        await _db.SaveChangesAsync(); 
        
        return yeniKategori;
    }

   public async Task<(bool Basarili, string Mesaj)> KategoriSilAsync(int id)
    {
        var kategori = await _db.Kategoriler.FindAsync(id);
        if (kategori == null) 
            return (false, "Kategori bulunamadı.");

        // KONTROL: Bu kategoriye bağlı herhangi bir ürün var mı?
        bool urunVarMi = await _db.Urunler.AnyAsync(u => u.KategoriId == id);
        
        if (urunVarMi) 
        {
            return (false, "Bu kategoriye ait ürünler olduğu için silinemez. Önce ürünlerin kategorisini değiştirin."); 
        }

        _db.Kategoriler.Remove(kategori);
        await _db.SaveChangesAsync();
        return (true, "Kategori başarıyla silindi.");
    }
}