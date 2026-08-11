using ECommerceApi.DataAccess;
using ECommerceApi.DTOs;
using ECommerceApi.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ECommerceApi.Services;

public class KuponService : IKuponService
{
    private readonly AppDbContext _db;
    private readonly IBildirimService _bildirimService; 

    public KuponService(AppDbContext db, IBildirimService bildirimService)
    {
        _db = db;
        _bildirimService = bildirimService;
    }

  // 1. ADMİN VE SATICILARIN MANUEL KUPON OLUŞTURMASI VE OTOMATİK DAĞITIM
    public async Task<(bool Basarili, string Mesaj)> KuponOlusturAsync(KuponOlusturDto dto, string olusturanRol, int? magazaId, List<int>? secilenUrunIds = null)
    {
        var kodVarMi = await _db.Kuponlar.AnyAsync(k => k.Kodu.ToUpper() == dto.Kodu.ToUpper());
        if (kodVarMi) return (false, "Bu kupon kodu zaten mevcut. Lütfen farklı bir kod belirleyin.");

        var yeniKupon = new Kupon
        {
            Kodu = dto.Kodu.ToUpper(),
            OlusturanRol = olusturanRol,
            MagazaId = magazaId,
            IndirimTipi = dto.IndirimTipi,
            IndirimDegeri = dto.IndirimDegeri,
            AltLimit = dto.AltLimit,
            BitisTarihi = DateTime.UtcNow.AddDays(dto.GecerlilikGunu),
            HerkeseAcikMi = dto.HerkeseAcikMi, 
            AktifMi = true
        };

        await _db.Kuponlar.AddAsync(yeniKupon);
        await _db.SaveChangesAsync();

        if (secilenUrunIds != null && secilenUrunIds.Any())
        {
            var kuponUrunleri = secilenUrunIds.Select(urunId => new KuponUrun
            {
                KuponId = yeniKupon.Id,
                UrunId = urunId
            }).ToList();

            await _db.Set<KuponUrun>().AddRangeAsync(kuponUrunleri);
            await _db.SaveChangesAsync();
        }

        // ====================================================================
        // YENİ: ADMİN HERKESE AÇIK KUPON YAPTIĞINDA TÜM KULLANICILARA BİLDİRİM
        // ====================================================================
        if (olusturanRol == "Admin" && dto.HerkeseAcikMi)
        {
            var tumMusteriler = await _db.Kullanicilar
                .Where(u => u.Rol == "Kullanici" && !u.IsDeleted)
                .Select(u => u.Id)
                .ToListAsync();

            string indirimMetniGenel = dto.IndirimTipi == "Yuzde" ? $"%{dto.IndirimDegeri}" : $"{dto.IndirimDegeri} ₺";
            
            foreach (var musteriId in tumMusteriler)
            {
                try
                {
                    await _bildirimService.BildirimGonderAsync(
                        musteriId,
                        "🌟 Efsane Fırsat: Yeni Kupon Yayınlandı!",
                        $"Tüm alışverişlerinde kullanabileceğin {indirimMetniGenel} indirim sağlayan '{yeniKupon.Kodu}' kodlu hediye kupon cüzdanına eklendi!",
                        "Kupon",
                        "/kuponlarim" // Düzeltilmiş rota
                    );
                }
                catch { /* Hata engelleme */ }
            }
        }
        // ====================================================================

        // MAĞAZANIN TAKİPÇİLERİNE KUPON DAĞITIMI VE BİLDİRİM GÖNDERİMİ
        if (magazaId.HasValue && !dto.HerkeseAcikMi)
        {
            var takipciIdleri = await _db.Takipciler
                .Where(t => t.MagazaId == magazaId.Value)
                .Select(t => t.KullaniciId)
                .ToListAsync();

            if (takipciIdleri.Any())
            {
                var cuzdanKayitlari = takipciIdleri.Select(kId => new KullaniciKupon
                {
                    KullaniciId = kId,
                    KuponId = yeniKupon.Id,
                    KullanildiMi = false
                }).ToList();

                await _db.KullaniciKuponlari.AddRangeAsync(cuzdanKayitlari);
                await _db.SaveChangesAsync();

                string indirimMetni = dto.IndirimTipi == "Yuzde" ? $"%{dto.IndirimDegeri}" : $"{dto.IndirimDegeri} ₺";
                foreach (var tId in takipciIdleri)
                {
                    try
                    {
                        await _bildirimService.BildirimGonderAsync(
                            tId,
                            "🎟️ Sana Özel Yeni Kupon Geldi!",
                            $"Takip ettiğin mağaza sana {indirimMetni} indirim sağlayan '{yeniKupon.Kodu}' kodlu VIP kupon tanımladı! Hemen kullan.",
                            "Kupon",
                            "/kuponlarim" // Hata önlemek için direkt güncel rota kullanıldı
                        );
                    }
                    catch { /* Hata olursa diğerlerine göndermeye devam et */ }
                }

                return (true, $"Kupon başarıyla oluşturuldu ve {takipciIdleri.Count} takipçinize otomatik olarak dağıtıldı! 🎉");
            }
        }

        return (true, "Kupon başarıyla oluşturuldu.");
    }
    // 2. MAĞAZA TAKİP ETME (Otomatik VIP kuponları kazanma sistemi) VE BİLDİRİM
    public async Task<(bool Basarili, string Mesaj, string KuponKodu)> MagazaTakipEtVeKuponKazanAsync(int kullaniciId, int magazaId)
    {
        var kullanici = await _db.Kullanicilar.FindAsync(kullaniciId);
        if (kullanici == null || kullanici.Rol != "Kullanici")
            return (false, "Sadece standart üyeler takip edebilir.", "");

        var dahaOnceTakipEttiMi = await _db.Takipciler.AnyAsync(t => t.KullaniciId == kullaniciId && t.MagazaId == magazaId);
        if (dahaOnceTakipEttiMi) 
            return (false, "Bu mağazayı zaten takip ediyorsunuz.", "");

        await _db.Takipciler.AddAsync(new Takipci { KullaniciId = kullaniciId, MagazaId = magazaId });
        await _db.SaveChangesAsync();

        var magazaninVIPKuponlari = await _db.Kuponlar
            .Where(k => k.MagazaId == magazaId && !k.HerkeseAcikMi && k.AktifMi && (!k.BitisTarihi.HasValue || k.BitisTarihi > DateTime.UtcNow))
            .ToListAsync();

        int kazanilanKuponSayisi = 0;
        string ilkKuponKodu = "";

        foreach (var kupon in magazaninVIPKuponlari)
        {
             var cuzdanindaVarMi = await _db.KullaniciKuponlari.AnyAsync(kk => kk.KullaniciId == kullaniciId && kk.KuponId == kupon.Id);
             if (!cuzdanindaVarMi)
             {
                 await _db.KullaniciKuponlari.AddAsync(new KullaniciKupon { KullaniciId = kullaniciId, KuponId = kupon.Id });
                 kazanilanKuponSayisi++;
                 if (string.IsNullOrEmpty(ilkKuponKodu)) ilkKuponKodu = kupon.Kodu;
             }
        }
        
        if (kazanilanKuponSayisi > 0)
        {
            await _db.SaveChangesAsync();

            try
            {
                await _bildirimService.BildirimGonderAsync(
                    kullaniciId,
                    "🎉 Mağazayı Takip Ettin, Kuponları Kaptın!",
                    $"Mağazayı takip ettiğin için cüzdanına tam {kazanilanKuponSayisi} adet VIP kupon eklendi. Göz atmayı unutma!",
                    "Kupon",
                    "/kuponlarim" // 🌟 DÜZELTİLDİ
                );
            }
            catch { /* Hata olursa patlama */ }

            return (true, $"Mağazayı takip ettiniz ve mağazanın {kazanilanKuponSayisi} adet VIP kuponu cüzdanınıza otomatik eklendi! 🎉", ilkKuponKodu);
        }

        return (true, "Mağazayı başarıyla takip ettiniz.", "");
    }

    // 3. YENİ KAYIT HOŞ GELDİN KUPONU VE BİLDİRİM
    public async Task<(bool Basarili, string Mesaj)> YeniKullaniciyaHosgeldinKuponuVerAsync(int kullaniciId)
    {
        var kullanici = await _db.Kullanicilar.FindAsync(kullaniciId);
        if (kullanici == null || kullanici.Rol != "Kullanici") 
            return (false, "Sadece standart müşteriler kupon alabilir.");

        string kod = "HOSGELDIN20";
        var hosgeldinKuponu = await _db.Kuponlar.FirstOrDefaultAsync(k => k.Kodu == kod && k.AktifMi);

        if (hosgeldinKuponu == null) return (true, "Kayıt işlemi başarılı.");

        var dahaOnceTanimlandiMi = await _db.KullaniciKuponlari
            .AnyAsync(kk => kk.KullaniciId == kullaniciId && kk.KuponId == hosgeldinKuponu.Id);

        if (dahaOnceTanimlandiMi) return (false, "Hoş geldin kuponu zaten tanımlanmış.");

        await _db.KullaniciKuponlari.AddAsync(new KullaniciKupon { KullaniciId = kullaniciId, KuponId = hosgeldinKuponu.Id });
        await _db.SaveChangesAsync();

        try
        {
            await _bildirimService.BildirimGonderAsync(
                kullaniciId,
                "👋 Aramıza Hoş Geldin!",
                "Sana özel tanımladığımız 'HOSGELDIN20' kupon kodunu ilk alışverişinde kullanarak indirim kazanabilirsin.",
                "Kupon",
                "/kuponlarim" // 🌟 DÜZELTİLDİ
            );
        }
        catch { /* Hata olursa patlama */ }

        return (true, "HOSGELDIN20 kuponu başarıyla tanımlandı.");
    }

    // 4. MÜŞTERİNİN KENDİ KUPONLARINI LİSTELEMESİ
    public async Task<object> KullaniciKuponlariniGetirAsync(int kullaniciId)
    {
        var cuzdanKuponlari = await _db.KullaniciKuponlari
            .Include(kk => kk.Kupon).ThenInclude(k => k!.Magaza)
            .Include(kk => kk.Kupon).ThenInclude(k => k!.KuponUrunleri!).ThenInclude(ku => ku.Urun)
            .Where(kk => kk.KullaniciId == kullaniciId)
            .Select(kk => kk.Kupon)
            .ToListAsync();

        var tumPublicKuponlar = await _db.Kuponlar
            .Include(k => k.Magaza)
            .Include(k => k.KuponUrunleri!).ThenInclude(ku => ku.Urun)
            .Where(k => k.HerkeseAcikMi && k.AktifMi && 
                        (!k.BitisTarihi.HasValue || k.BitisTarihi > DateTime.UtcNow))
            .ToListAsync();

        var kullanilmisKuponIdleri = await _db.KullaniciKuponlari
            .Where(kk => kk.KullaniciId == kullaniciId && kk.KullanildiMi)
            .Select(kk => kk.KuponId)
            .ToListAsync();

        var tumKuponlar = cuzdanKuponlari.Concat(tumPublicKuponlar!)
            .Where(k => k != null)
            .GroupBy(k => k!.Id) 
            .Select(g => g.First())
            .Select(k => new
            {
                KuponKodu = k!.Kodu,
                IndirimTipi = k.IndirimTipi,
                IndirimDegeri = k.IndirimDegeri,
                AltLimit = k.AltLimit,
                BitisTarihi = (k.BitisTarihi.HasValue && k.BitisTarihi.Value.Year > 1000) 
                                ? k.BitisTarihi.Value.ToString("yyyy-MM-ddTHH:mm:ss") 
                                : null,
                GecerliMagaza = k.MagazaId == null ? "Tüm Mağazalarda Geçerli" : k.Magaza!.MagazaAdi,
                
                KullanildiMi = kullanilmisKuponIdleri.Contains(k.Id),
                SuresiDolduMu = k.BitisTarihi.HasValue && k.BitisTarihi.Value < DateTime.UtcNow,
                UrunKuponuMu = k.KuponUrunleri != null && k.KuponUrunleri.Any(),
                UrunAdlari = k.KuponUrunleri != null ? k.KuponUrunleri.Select(ku => ku.Urun!.Ad).ToList() : new List<string>()
            })
            .OrderBy(k => k.KullanildiMi).ThenBy(k => k.SuresiDolduMu) 
            .ToList();

        return tumKuponlar;
    }

    // 5. KUPONUN GEÇERLİLİĞİNİ KONTROL ET VE İNDİRİM HESAPLA
    public async Task<(bool Basarili, string Mesaj, decimal IndirimTutari, int? KuponId)> KuponUygulaDetayliAsync(int kullaniciId, string kuponKodu, decimal sepetToplami, List<SepetUrunDto> sepetUrunleri)
    {
        var kupon = await _db.Kuponlar
            .Include(k => k.KullaniciKuponlari)
            .Include(k => k.KuponUrunleri)
            .FirstOrDefaultAsync(k => k.Kodu.ToUpper() == kuponKodu.ToUpper() && k.AktifMi);

        if (kupon == null) return (false, "Geçersiz kupon kodu.", 0, null);

        if (kupon.BitisTarihi.HasValue && kupon.BitisTarihi.Value < DateTime.UtcNow) 
            return (false, "Bu kuponun süresi dolmuş.", 0, null);

        if (!kupon.HerkeseAcikMi)
        {
            var cuzdanindaVarMi = kupon.KullaniciKuponlari != null && 
                                  kupon.KullaniciKuponlari.Any(kk => kk.KullaniciId == kullaniciId);
            
            if (!cuzdanindaVarMi) 
                return (false, "Bu kupon kodu size özel tanımlanmamış veya cüzdanınızda bulunmuyor.", 0, null);
        }

        var dahaOnceKullandiMi = kupon.KullaniciKuponlari != null && 
                                 kupon.KullaniciKuponlari.Any(kk => kk.KullaniciId == kullaniciId && kk.KullanildiMi);
        
        if (dahaOnceKullandiMi) return (false, "Bu kuponu daha önce kullandınız.", 0, null);

        if (sepetToplami < kupon.AltLimit) 
            return (false, $"Bu kupon için sepet tutarınız yetersiz. Minimum {kupon.AltLimit} TL olmalıdır.", 0, null);

        decimal indirimUygulanacakTutar = sepetToplami;
        var kuponUrunIdleri = kupon.KuponUrunleri?.Select(ku => ku.UrunId).ToList() ?? new List<int>();

        if (kuponUrunIdleri.Any())
        {
            var gecerliSepetUrunleri = sepetUrunleri.Where(su => kuponUrunIdleri.Contains(su.UrunId)).ToList();
            if (!gecerliSepetUrunleri.Any()) return (false, "Bu kupon sepetinizdeki ürünler için geçerli değil.", 0, null);
            
            indirimUygulanacakTutar = gecerliSepetUrunleri.Sum(su => su.Fiyat * su.Adet);
        }
        else if (kupon.MagazaId.HasValue)
        {
            var sepetMagazaIds = sepetUrunleri.Select(su => su.MagazaId).Distinct().ToList();
            if (!sepetMagazaIds.Contains(kupon.MagazaId.Value))
            {
                return (false, "Bu kupon sepetinizdeki ürünler için geçerli değil (Farklı mağaza kuponu).", 0, null);
            }
        }

        decimal indirimTutari = 0;
        if (kupon.IndirimTipi == "Tutar")
        {
            indirimTutari = kupon.IndirimDegeri;
            if (indirimTutari > indirimUygulanacakTutar) indirimTutari = indirimUygulanacakTutar; 
        }
        else if (kupon.IndirimTipi == "Yuzde")
        {
            indirimTutari = (indirimUygulanacakTutar * kupon.IndirimDegeri) / 100;
        }

        return (true, "Kupon başarıyla uygulandı!", indirimTutari, kupon.Id);
    }

    // 6. YÖNETİCİ KUPONLARINI GETİR
    public async Task<object> YoneticiKuponlariniGetirAsync(int userId, string rol)
    {
        var query = _db.Kuponlar
            .Include(k => k.KuponUrunleri)
            .Include(k => k.KullaniciKuponlari!)
                .ThenInclude(kk => kk.Kullanici) 
            .AsQueryable();
        
        if (rol == "Satici")
        {
            var magaza = await _db.Magazalar.FirstOrDefaultAsync(m => m.KullaniciId == userId);
            if (magaza == null) return new List<object>(); 
            query = query.Where(k => k.MagazaId == magaza.Id);
        }
        else if (rol == "Admin")
        {
            query = query.Where(k => k.MagazaId == null); 
        }

        return await query.OrderByDescending(k => k.Id).Select(k => new 
        {
            id = k.Id,
            kodu = k.Kodu,
            indirimTipi = k.IndirimTipi,
            indirimDegeri = k.IndirimDegeri,
            altLimit = k.AltLimit,
            bitisTarihi = k.BitisTarihi,
            herkeseAcikMi = k.HerkeseAcikMi, 
            urunKuponuMu = k.KuponUrunleri != null && k.KuponUrunleri.Any(),
            urunAdlari = k.KuponUrunleri != null ? k.KuponUrunleri.Select(ku => ku.Urun!.Ad).ToList() : new List<string>(),
            tanimliKullanicilar = k.KullaniciKuponlari != null ? k.KullaniciKuponlari.Select(kk => kk.Kullanici!.AdSoyad ?? kk.Kullanici.Email).ToList() : new List<string>(),
            tanimliKullaniciIdleri = k.KullaniciKuponlari != null ? k.KullaniciKuponlari.Select(kk => kk.KullaniciId).ToList() : new List<int>()
        }).ToListAsync();
    }

    // 7. KUPON SİL
    public async Task<(bool Basarili, string Mesaj)> KuponSilAsync(int kuponId, int userId, string rol)
    {
        var kupon = await _db.Kuponlar.FindAsync(kuponId);
        if (kupon == null) return (false, "Kupon bulunamadı.");

        if (rol == "Satici")
        {
            var magaza = await _db.Magazalar.FirstOrDefaultAsync(m => m.KullaniciId == userId);
            if (magaza == null || kupon.MagazaId != magaza.Id)
                return (false, "Bu kuponu silme yetkiniz yok.");
        }

        _db.Kuponlar.Remove(kupon);
        await _db.SaveChangesAsync();
        return (true, "Kupon başarıyla silindi.");
    }

    // 8. ADMİNİN MANUEL KULLANICILARA KUPON ATAMASI VE BİLDİRİM
    public async Task<(bool Basarili, string Mesaj)> KullanicilaraKuponTanimlaAsync(int kuponId, List<int> kullaniciIdleri)
    {
        var kupon = await _db.Kuponlar.FindAsync(kuponId);
        if (kupon == null) return (false, "Tanımlanmak istenen kupon bulunamadı.");

        var gecerliKullaniciIdleri = await _db.Kullanicilar
            .Where(u => kullaniciIdleri.Contains(u.Id) && u.Rol == "Kullanici" && !u.IsDeleted)
            .Select(u => u.Id)
            .ToListAsync();

        var mevcutSahipler = await _db.KullaniciKuponlari
            .Where(kk => kk.KuponId == kuponId)
            .ToListAsync();

        var mevcutKullaniciIdleri = mevcutSahipler.Select(kk => kk.KullaniciId).ToList();

        var silinecekKuponlar = mevcutSahipler
            .Where(kk => !gecerliKullaniciIdleri.Contains(kk.KullaniciId))
            .ToList();

        if (silinecekKuponlar.Any())
        {
            _db.KullaniciKuponlari.RemoveRange(silinecekKuponlar);
        }

        var eklenecekKullaniciIdleri = gecerliKullaniciIdleri
            .Where(id => !mevcutKullaniciIdleri.Contains(id))
            .ToList();

        if (eklenecekKullaniciIdleri.Any())
        {
            var eklenecekKuponlar = eklenecekKullaniciIdleri
                .Select(id => new KullaniciKupon { KullaniciId = id, KuponId = kuponId })
                .ToList();

            await _db.KullaniciKuponlari.AddRangeAsync(eklenecekKuponlar);
            await _db.SaveChangesAsync();

            string indirimMetni = kupon.IndirimTipi == "Yuzde" ? $"%{kupon.IndirimDegeri}" : $"{kupon.IndirimDegeri} ₺";
            foreach (var id in eklenecekKullaniciIdleri)
            {
                try
                {
                    await _bildirimService.BildirimGonderAsync(
                        id,
                        "🎁 Sana Özel Sürpriz Bir Kupon Tanımlandı!",
                        $"Cüzdanına {indirimMetni} indirim sağlayan '{kupon.Kodu}' kodlu hediye kupon tanımladık. İyi alışverişler dileriz!",
                        "Kupon",
                        "/kuponlarim" // 🌟 DÜZELTİLDİ
                    );
                }
                catch { /* Hata engelleme */ }
            }
        }
        else
        {
             await _db.SaveChangesAsync();
        }

        return (true, "Kupon atamaları başarıyla güncellendi.");
    }

    // 9. ÜRÜNÜN KUPONLARINI GETİR
    public async Task<object> UrununKuponlariniGetirAsync(int urunId)
    {
        var urun = await _db.Urunler.FindAsync(urunId);
        if (urun == null) throw new Exception("Ürün bulunamadı.");

        var suAn = DateTime.UtcNow;

        var kuponlar = await _db.Kuponlar
            .Include(k => k.KuponUrunleri)
            .Where(k => k.MagazaId == urun.MagazaId && 
                        k.AktifMi == true && 
                        (k.BitisTarihi == null || k.BitisTarihi > suAn) && 
                        k.KuponUrunleri != null && 
                        k.KuponUrunleri.Any(ku => ku.UrunId == urunId))
            .Select(k => new 
            {
                id = k.Id,
                kodu = k.Kodu,
                indirimTipi = k.IndirimTipi,
                indirimDegeri = k.IndirimDegeri,
                altLimit = k.AltLimit,
                bitisTarihi = k.BitisTarihi,
                urunKuponuMu = true,
                herkeseAcikMi = k.HerkeseAcikMi 
            })
            .ToListAsync();

        return kuponlar;
    }
}