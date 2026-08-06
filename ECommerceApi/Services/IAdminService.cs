using ECommerceApi.DTOs;

namespace ECommerceApi.Services;

public interface IAdminService
{
    Task<object> GetDashboardIstatistikleriAsync();
    Task<object> TumSiparisleriGetirAsync();
    Task<(bool Basarili, string Mesaj)> SiparisDetayDurumGuncelleAsync(int detayId, SiparisDetayGuncelleDTO dto);
    Task<(bool Basarili, string Mesaj, string? YeniDurum)> SiparisDurumGuncelleAsync(int id, SiparisDurumGuncelleDTO dto);
    Task<(bool Basarili, string Mesaj)> KullaniciSilAsync(int userId);
    Task<(bool Basarili, string Mesaj)> KullaniciAktiflestirAsync(int userId);
    
    // Mağaza Onay İşlemleri
    Task<bool> MagazaOnaylaAsync(int magazaId);
    Task<object> BekleyenMagazalariGetirAsync();
    Task<object> TumMagazalariGetirAsync();
    Task<(bool Basarili, string Mesaj)> MagazaReddetAsync(int magazaId);

    // YENİ: Ürün Onay İşlemleri
    Task<object> OnayBekleyenUrunleriGetirAsync();
    Task<(bool Basarili, string Mesaj)> UrunuOnaylaAsync(int urunId);
    Task<(bool Basarili, string Mesaj)> UrunuReddetAsync(int urunId);
    Task<object> OnaylananUrunleriGetirAsync();
}