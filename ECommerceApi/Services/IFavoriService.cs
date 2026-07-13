using ECommerceApi.DTOs;

namespace ECommerceApi.Services;

public interface IFavoriService
{
    Task<(bool Basarili, string Mesaj)> FavoriEkleAsync(int kullaniciId, FavoriEkleDTO dto);
    Task<object> FavorileriGetirAsync(int kullaniciId);
    Task<(bool Basarili, string Mesaj)> FavoriSilAsync(int kullaniciId, int urunId);
}