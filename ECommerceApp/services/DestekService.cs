using ECommerceApi.DataAccess;
using ECommerceApi.Entities;
using ECommerceApi.DTOs;
using Microsoft.EntityFrameworkCore;

namespace ECommerceApi.Services;

public class DestekService : IDestekService
{
    private readonly AppDbContext _db;

    public DestekService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<(bool Basarili, string Mesaj)> YeniTalepOlusturAsync(int userId, DestekTalebiDTO dto)
    {
        var yeniTalep = new DestekTalepleri
        {
            KullaniciId = userId,
            Konu = dto.Konu,
            Mesaj = dto.Mesaj,
            Durum = "Bekliyor",
            OlusturulmaTarihi = DateTime.UtcNow
        };

        _db.DestekTalepleri.Add(yeniTalep);
        await _db.SaveChangesAsync();

        return (true, "Mesajınız başarıyla iletildi. En kısa sürede yanıtlayacağız.");
    }

    public async Task<object> KullaniciTalepleriniGetirAsync(int userId)
    {
        return await _db.DestekTalepleri
            .Where(d => d.KullaniciId == userId)
            .OrderByDescending(d => d.OlusturulmaTarihi)
            .Select(d => new 
            { 
                d.Id, 
                d.Konu, 
                d.Mesaj, 
                d.AdminCevabi, 
                d.Durum, 
                d.OlusturulmaTarihi, 
                d.CevaplanmaTarihi 
            })
            .ToListAsync();
    }

    public async Task<object> TumTalepleriGetirAdminAsync()
    {
        return await _db.DestekTalepleri
            .Include(d => d.Kullanici)
            .OrderBy(d => d.Durum == "Bekliyor" ? 0 : 1)
            .ThenByDescending(d => d.OlusturulmaTarihi)
            .Select(d => new 
            { 
                d.Id, 
                KullaniciAdi = d.Kullanici.AdSoyad, 
                KullaniciEmail = d.Kullanici.Email,
                d.Konu, 
                d.Mesaj, 
                d.AdminCevabi, 
                d.Durum, 
                d.OlusturulmaTarihi 
            })
            .ToListAsync();
    }

    public async Task<(bool Basarili, string Mesaj)> TalebiCevaplaAsync(int id, DestekCevapDTO dto)
    {
        var talep = await _db.DestekTalepleri.FindAsync(id);
        if (talep == null) return (false, "Talep bulunamadı.");

        talep.AdminCevabi = dto.Cevap;
        talep.Durum = "Cevaplandı";
        talep.CevaplanmaTarihi = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return (true, "Kullanıcıya başarıyla cevap verildi.");
    }
}