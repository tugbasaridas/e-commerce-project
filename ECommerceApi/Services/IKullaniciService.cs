using ECommerceApi.DTOs;

namespace ECommerceApi.Services;

public interface IKullaniciService
{
    Task<object> TumKullanicilariGetirAsync();
    Task<object?> ProfilBilgileriniGetirAsync(int userId);
    Task<(bool Basarili, string Mesaj)> KayitOlAsync(KayitDTO dto);
    Task<(bool Basarili, string Mesaj, string? Token, string? Rol,int? KullaniciId)> GirisYapAsync(GirisDTO dto);
}