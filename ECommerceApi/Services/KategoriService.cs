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
}