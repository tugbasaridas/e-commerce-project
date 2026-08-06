using ECommerceApi.DataAccess;
using ECommerceApi.DTOs;
using ECommerceApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace ECommerceApi.Services;

public class UrunSoruService : IUrunSoruService
{
    private readonly AppDbContext _db;

    public UrunSoruService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<(bool Basarili, string Mesaj)> SoruSorAsync(int kullaniciId, SoruEkleDTO dto)
    {
        var urun = await _db.Urunler.FindAsync(dto.UrunId);
        if (urun == null) return (false, "Ürün bulunamadı.");

        var soru = new UrunSoru
        {
            KullaniciId = kullaniciId,
            UrunId = dto.UrunId,
            SoruMetni = dto.SoruMetni,
            SoruTarihi = DateTime.UtcNow,
            CevaplandiMi = false
        };

        _db.UrunSorulari.Add(soru);
        await _db.SaveChangesAsync();

        return (true, "Sorunuz başarıyla satıcıya iletildi.");
    }

    public async Task<object> UrunSorulariniGetirAsync(int urunId)
    {
        // 1. Veriyi veritabanından saf (ilişkisel) haliyle çekiyoruz. (SQL Sorgusu burada biter)
        var hamSorular = await _db.UrunSorulari
            .Include(s => s.Kullanici)
            .Include(s => s.Urun)
                .ThenInclude(u => u!.Magaza)
            .Where(s => s.UrunId == urunId)
            .OrderByDescending(s => s.SoruTarihi)
            .ToListAsync(); 

        // 2. SQL'in hata vereceği string (metin) parçalama işlemlerini C# tarafında yapıyoruz
        var sonuc = hamSorular.Select(s => 
        {
            // Müşteri adını "T*** Y***" şeklinde güvenli maskeleme
            string maskeliIsim = "Anonim";
            if (s.Kullanici != null && !string.IsNullOrWhiteSpace(s.Kullanici.AdSoyad))
            {
                var adParcalari = s.Kullanici.AdSoyad.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (adParcalari.Length > 0)
                {
                    string ilkAd = adParcalari.First();
                    string soyad = adParcalari.Last();
                    maskeliIsim = $"{ilkAd[0]}*** {(adParcalari.Length > 1 ? soyad[0] + "***" : "")}";
                }
            }

            return new SoruListeleDTO
            {
                Id = s.Id,
                SoruMetni = s.SoruMetni,
                SoruTarihi = s.SoruTarihi,
                MusteriAdi = maskeliIsim,
                CevaplandiMi = s.CevaplandiMi,
                CevapMetni = s.CevapMetni,
                CevapTarihi = s.CevapTarihi,
                MagazaAdi = s.Urun?.Magaza?.MagazaAdi ?? "Bilinmiyor"
            };
        }).ToList();

        return sonuc;
    }

    public async Task<object> SaticiSorulariniGetirAsync(int saticiKullaniciId)
    {
        // Önce satıcının mağazasını buluyoruz
        var magaza = await _db.Magazalar.FirstOrDefaultAsync(m => m.KullaniciId == saticiKullaniciId);
        if (magaza == null) return new List<object>();

        // Sadece kendi mağazasının ürünlerine gelen soruları getiriyor
        return await _db.UrunSorulari
            .Include(s => s.Urun)
            .Include(s => s.Kullanici)
            .Where(s => s.Urun!.MagazaId == magaza.Id)
            .OrderBy(s => s.CevaplandiMi) // Önce cevaplanmamışlar (bekleyenler) gelsin
            .ThenByDescending(s => s.SoruTarihi)
            .Select(s => new 
            {
                SoruId = s.Id,
                UrunId = s.UrunId,
                UrunAdi = s.Urun!.Ad,
                UrunResmi = s.Urun.ResimUrl,
                SoruMetni = s.SoruMetni,
                SoruTarihi = s.SoruTarihi,
                CevaplandiMi = s.CevaplandiMi,
                CevapMetni = s.CevapMetni,
                MusteriAdi = s.Kullanici != null ? s.Kullanici.AdSoyad : "Misafir Kullanıcı"
            })
            .ToListAsync();
    }

    public async Task<(bool Basarili, string Mesaj)> SoruCevaplaAsync(int saticiKullaniciId, int soruId, SoruCevaplaDTO dto)
    {
        var soru = await _db.UrunSorulari
            .Include(s => s.Urun)
                .ThenInclude(u => u!.Magaza)
            .FirstOrDefaultAsync(s => s.Id == soruId);

        if (soru == null) return (false, "Soru bulunamadı.");

        // Güvenlik: Bu sorunun sorulduğu ürün, giriş yapan satıcının mağazasına mı ait?
        if (soru.Urun!.Magaza.KullaniciId != saticiKullaniciId)
            return (false, "Yetkisiz işlem! Sadece kendi ürünlerinize gelen soruları cevaplayabilirsiniz.");

        soru.CevapMetni = dto.CevapMetni;
        soru.CevapTarihi = DateTime.UtcNow;
        soru.CevaplandiMi = true;

   
        var yeniBildirim = new Bildirim
        {
            KullaniciId = soru.KullaniciId, // Soruyu soran müşterinin ID'si
            Baslik = "Ürün Sorunuza Cevap Verildi!",
            Icerik = $"{soru.Urun.Ad} ürününüz için sorduğunuz soru satıcı tarafından yanıtlandı.",
            Tarih = DateTime.UtcNow,
            OkunduMu = false // Bu sayede zil kırmızı yanacak!
        };

        _db.Bildirimler.Add(yeniBildirim);
    

        await _db.SaveChangesAsync();
        return (true, "Cevabınız başarıyla yayınlandı.");
    }
}