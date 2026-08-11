using ECommerceApi.DTOs;
using ECommerceApi.Entities;

namespace ECommerceApi.Services;

public interface ISaticiService
{
    Task<bool> UrunEkleAsync(int kullaniciId, SaticiUrunEkleDto dto);
    Task<List<Urunler>> KendiUrunlerimiGetirAsync(int kullaniciId);
    Task<bool> UrunGuncelleAsync(int kullaniciId, int urunId, SaticiUrunGuncelleDto dto);
    Task<bool> SaticiKayitAsync(MagazaBasvuruDto dto);
    Task<bool> UrunSilAsync(int kullaniciId, int urunId);
    Task<object> KendiMagazamdakiSiparisleriGetirAsync(int kullaniciId);
    Task<(bool Basarili, string Mesaj)> SiparisDetayDurumGuncelleAsync(int kullaniciId, int detayId, SiparisDetayGuncelleDTO dto);
    Task<(bool Basarili, string Mesaj)> IndirimYapAsync(int kullaniciId, int urunId, decimal yeniFiyat, int saat);
    Task<(bool Basarili, string Mesaj)> IndirimiKaldirAsync(int kullaniciId, int urunId);
    Task<object> SaticiProfilBilgisiGetirAsync(int kullaniciId);
    Task<(bool Basarili, string Mesaj)> SaticiIadeDurumGuncelleAsync(int kullaniciId, IadeDurumGuncelleDto dto);
    Task<object> SaticiIadeTalepleriniGetirAsync(int kullaniciId);

}