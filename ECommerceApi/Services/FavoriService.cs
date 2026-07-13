using ECommerceApi.DataAccess;
using ECommerceApi.Entities;
using ECommerceApi.DTOs;
using Microsoft.EntityFrameworkCore;

namespace ECommerceApi.Services;

public class FavoriService : IFavoriService
{
    private readonly AppDbContext _db;

    public FavoriService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<(bool Basarili, string Mesaj)> FavoriEkleAsync(int kullaniciId, FavoriEkleDTO dto)
    {
        var zatenVarMi = await _db.Favoriler.AnyAsync(f => f.KullaniciId == kullaniciId && f.UrunId == dto.UrunId);
        if (zatenVarMi) return (false, "Bu ürün zaten favorilerinizde.");

        var yeniFavori = new Favori
        {
            KullaniciId = kullaniciId,
            UrunId = dto.UrunId
        };

        _db.Favoriler.Add(yeniFavori);
        await _db.SaveChangesAsync();

        return (true, "Ürün favorilere eklendi.");
    }

    public async Task<object> FavorileriGetirAsync(int kullaniciId)
    {
        return await _db.Favoriler
            .Include(f => f.Urunler)
                .ThenInclude(u => u!.Oylamalar) 
            .Where(f => f.KullaniciId == kullaniciId)
            .Select(f => new 
            {
                FavoriId = f.Id,
                UrunId = f.UrunId,
                Ad = f.Urunler != null ? f.Urunler.Ad : "Ürün Silinmiş", 
                Fiyat = f.Urunler != null ? f.Urunler.Fiyat : 0,
                ResimUrl = f.Urunler != null ? f.Urunler.ResimUrl : "",
                
                OrtalamaPuan = (f.Urunler != null && f.Urunler.Oylamalar != null && f.Urunler.Oylamalar.Any()) 
                               ? Math.Round(f.Urunler.Oylamalar.Average(o => o.Puan), 1) 
                               : 0.0,
                OylamaSayisi = (f.Urunler != null && f.Urunler.Oylamalar != null) 
                               ? f.Urunler.Oylamalar.Count() 
                               : 0
            })
            .ToListAsync();
    }

    public async Task<(bool Basarili, string Mesaj)> FavoriSilAsync(int kullaniciId, int urunId)
    {
        var favori = await _db.Favoriler.FirstOrDefaultAsync(f => f.KullaniciId == kullaniciId && f.UrunId == urunId);
        
        if (favori == null) return (false, "Bu ürün favorilerinizde bulunamadı.");

        _db.Favoriler.Remove(favori);
        await _db.SaveChangesAsync();

        return (true, "Ürün favorilerden çıkarıldı.");
    }
}