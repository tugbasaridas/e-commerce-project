using ECommerceApi.DataAccess;
using ECommerceApi.Entities;
using ECommerceApi.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;

namespace ECommerceApi.Services;

public class VitrinService : IVitrinService
{
    private readonly AppDbContext _db;

    public VitrinService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<object> TumVitrinBannerlariGetirAsync()
    {
        return await _db.VitrinBannerlar
            .OrderBy(v => v.SiraNo)
            .Select(v => new 
            {
                Id = v.Id,
                ResimUrl = v.ResimUrl,
                Baslik = v.Baslik,
                YonlendirmeTuru = v.YonlendirmeTuru,
                HedefId = v.HedefId,
                SiraNo = v.SiraNo,
                AktifMi = v.AktifMi,
                Tarih = v.OlusturulmaTarihi
            })
            .ToListAsync();
    }

    public async Task<(bool Basarili, string Mesaj)> VitrinBannerEkleAsync(VitrinBannerDto dto)
    {
        var yeniBanner = new VitrinBanner
        {
            ResimUrl = dto.ResimUrl,
            Baslik = dto.Baslik,
            YonlendirmeTuru = dto.YonlendirmeTuru,
            HedefId = dto.HedefId,
            SiraNo = dto.SiraNo,
            AktifMi = dto.AktifMi
        };

        _db.VitrinBannerlar.Add(yeniBanner);
        await _db.SaveChangesAsync();

        return (true, "Afiş başarıyla sisteme eklendi.");
    }

    public async Task<(bool Basarili, string Mesaj)> VitrinBannerDurumGuncelleAsync(int id, bool aktifMi)
    {
        var banner = await _db.VitrinBannerlar.FindAsync(id);
        if (banner == null) return (false, "Afiş bulunamadı.");

        banner.AktifMi = aktifMi;
        await _db.SaveChangesAsync();

        return (true, aktifMi ? "Afiş yayına alındı." : "Afiş pasife çekildi.");
    }

    public async Task<(bool Basarili, string Mesaj)> VitrinBannerSilAsync(int id)
    {
        var banner = await _db.VitrinBannerlar.FindAsync(id);
        if (banner == null) return (false, "Afiş bulunamadı.");

        _db.VitrinBannerlar.Remove(banner);
        await _db.SaveChangesAsync();

        return (true, "Afiş sistemden başarıyla silindi.");
    }
    public async Task<object> IndirimliUrunleriGetirAsync()
    {
        var suAn = DateTime.UtcNow;

        return await _db.Urunler
            .Include(u => u.Magaza)
            .Where(u => u.AdminOnayliMi == true 
                     && u.AktifMi == true 
                     && u.IndirimliFiyat != null 
                     && u.IndirimBitisTarihi != null 
                     && u.IndirimBitisTarihi > suAn) // Sadece süresi dolmamış olanlar
            .OrderBy(u => u.IndirimBitisTarihi) // Acil fırsatlar üstte çıksın
            .Select(u => new 
            {
                id = u.Id,
                ad = u.Ad,
                fiyat = u.Fiyat,
                indirimliFiyat = u.IndirimliFiyat,
                magazaAdi = u.Magaza != null ? u.Magaza.MagazaAdi : "Bilinmiyor"
            })
            .ToListAsync();
    }

    public async Task<(bool Basarili, string Mesaj)> VitrinBannerSiraGuncelleAsync(int id, int yeniSira)
{
    var banner = await _db.VitrinBannerlar.FindAsync(id);
    if (banner == null) return (false, "Afiş bulunamadı.");

    banner.SiraNo = yeniSira;
    await _db.SaveChangesAsync();

    return (true, "Afiş sırası başarıyla güncellendi.");
}

}