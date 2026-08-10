using ECommerceApi.DataAccess;
using ECommerceApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace ECommerceApi.Services;

public class BildirimService : IBildirimService
{
    private readonly AppDbContext _db;
    public BildirimService(AppDbContext db) => _db = db;

    public async Task BildirimGonderAsync(int kullaniciId, string baslik, string icerik, string bildirimTipi, string? yonlendirmeLinki = null)
    {
        var bildirim = new Bildirim
        {
            KullaniciId = kullaniciId,
            Baslik = baslik,
            Icerik = icerik,
            BildirimTipi = bildirimTipi,
            YonlendirmeLinki = yonlendirmeLinki
        };

        await _db.Bildirimler.AddAsync(bildirim);
        await _db.SaveChangesAsync();
    }

   public async Task<object> KullaniciBildirimleriniGetirAsync(int kullaniciId)
    {
        return await _db.Bildirimler
            .Where(b => b.KullaniciId == kullaniciId)
            .OrderByDescending(b => b.Tarih)
            .Take(50) 
            .Select(b => new {
                id = b.Id,
                baslik = b.Baslik,
                icerik = b.Icerik,
                bildirimTipi = b.BildirimTipi,
                yonlendirmeLinki = b.YonlendirmeLinki,
                okunduMu = b.OkunduMu,
                tarih = b.Tarih
            })
            .ToListAsync();
    }

    public async Task<int> OkunmamisBildirimSayisiGetirAsync(int kullaniciId)
    {
        return await _db.Bildirimler.CountAsync(b => b.KullaniciId == kullaniciId && !b.OkunduMu);
    }

    public async Task OkunduIsaretleAsync(int bildirimId, int kullaniciId)
    {
        var bildirim = await _db.Bildirimler.FirstOrDefaultAsync(b => b.Id == bildirimId && b.KullaniciId == kullaniciId);
        if (bildirim != null && !bildirim.OkunduMu)
        {
            bildirim.OkunduMu = true;
            await _db.SaveChangesAsync();
        }
    }

    public async Task TumunuOkunduIsaretleAsync(int kullaniciId)
    {
        var okunmamislar = await _db.Bildirimler
            .Where(b => b.KullaniciId == kullaniciId && !b.OkunduMu)
            .ToListAsync();
            
        if(okunmamislar.Any())
        {
            foreach (var b in okunmamislar) b.OkunduMu = true;
            await _db.SaveChangesAsync();
        }
    }
}