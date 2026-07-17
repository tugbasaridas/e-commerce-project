using ECommerceApi.DTOs;
using System.Threading.Tasks;

namespace ECommerceApi.Services;

public interface IKullaniciService
{
    Task<object> TumKullanicilariGetirAsync();
    
    Task<object?> ProfilBilgileriniGetirAsync(int userId);
    
    Task<(bool Basarili, string Mesaj)> KayitOlAsync(KayitDTO dto);

    Task<(bool Basarili, string Mesaj, string? Token, string? RefreshToken, string? Rol, int? KullaniciId)> GirisYapAsync(GirisDTO dto);

    Task<(bool Basarili, string Mesaj, string? Token, string? RefreshToken)> YeniTokenUretAsync(string mevcutRefreshToken);
}