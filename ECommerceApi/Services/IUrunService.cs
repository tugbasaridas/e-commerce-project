using ECommerceApi.DTOs;
using ECommerceApi.Entities;

namespace ECommerceApi.Services;

public interface IUrunService
{
    
    Task<List<UrunListelemeDTO>> TumUrunleriGetirAsync();
    
    Task<object?> UrunGetirByIdAsync(int id);
    Task<Urunler> UrunEkleAsync(UrunEkleDTO dto);
    Task<bool> UrunSilAsync(int id);
    Task<Urunler?> UrunGuncelleAsync(int id, UrunGuncelleDto guncelUrun);
    Task<(bool Basarili, string Mesaj)> UrunOylaAsync(int urunId, int userId, int puan, string? yorum = null);
    Task<List<UrunListelemeDTO>> IndirimliUrunleriGetirAsync();
    Task<(bool Basarili, string Mesaj)> IndirimYapAsync(int urunId, decimal yeniFiyat, int saat);
    Task<(bool Basarili, string Mesaj)> IndirimiKaldirAsync(int urunId);
}